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
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private planificateurService: PlanificateurService,
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

    const tokenDuJeune = rendezVous.jeune.pushNotificationToken
    if (tokenDuJeune) {
      const notification = Notification.createRdvSupprime(
        tokenDuJeune,
        rendezVous.date
      )
      await this.notificationRepository.send(notification)
    } else {
      this.logger.log(
        `Le jeune ${rendezVous.jeune.id} ne s'est jamais connecté sur l'application`
      )
    }

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
