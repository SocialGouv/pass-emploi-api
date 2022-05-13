import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { PlanificateurService } from 'src/domain/planificateur'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { buildError } from '../../utils/logger.module'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'
import { Mail, MailServiceToken } from '../../domain/mail'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'

export interface DeleteRendezVousCommand extends Command {
  idRendezVous: string
}

@Injectable()
export class DeleteRendezVousCommandHandler extends CommandHandler<
  DeleteRendezVousCommand,
  void
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private planificateurService: PlanificateurService,
    @Inject(MailServiceToken)
    private mailService: Mail.Service,
    private evenementService: EvenementService
  ) {
    super('DeleteRendezVousCommandHandler')
  }

  async handle(command: DeleteRendezVousCommand): Promise<Result<void>> {
    const rendezVous = await this.rendezVousRepository.get(command.idRendezVous)
    if (!rendezVous) {
      return failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
    }
    await this.rendezVousRepository.delete(command.idRendezVous)

    await Promise.all(
      rendezVous.jeunes.map(async jeune => {
        if (jeune.pushNotificationToken) {
          const notification = Notification.createRdvSupprime(
            jeune.pushNotificationToken,
            rendezVous.date
          )
          await this.notificationRepository.send(notification)
        } else {
          this.logger.log(
            `Le jeune ${jeune.id} ne s'est jamais connecté sur l'application`
          )
        }
      })
    )

    try {
      await this.planificateurService.supprimerRappelsRendezVous(rendezVous)
    } catch (e) {
      this.logger.error(
        buildError(
          `La suppression des notifications du rendez-vous ${rendezVous.id} a échoué`,
          e
        )
      )
      this.apmService.captureError(e)
    }

    if (rendezVous.invitation) {
      const createur = await this.conseillerRepository.get(
        rendezVous.createur.id
      )
      if (!createur) {
        return failure(
          new NonTrouveError(
            'Conseiller créateur du rendez-vous',
            rendezVous.createur.id
          )
        )
      }
      this.mailService.envoyerMailRendezVousSupprime(createur, rendezVous)
    }
    return emptySuccess()
  }

  async authorize(
    command: DeleteRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.rendezVousAuthorizer.authorize(command.idRendezVous, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.RDV_SUPPRIME,
      utilisateur
    )
  }
}
