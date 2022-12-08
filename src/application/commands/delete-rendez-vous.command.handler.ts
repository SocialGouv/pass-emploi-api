import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../domain/evenement'
import { PlanificateurService } from '../../domain/planificateur'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'
import { Mail, MailServiceToken } from '../../domain/mail'
import { Notification } from '../../domain/notification/notification'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'
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
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    private notificationService: Notification.Service,
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
    if (RendezVous.AnimationCollective.estCloturee(rendezVous)) {
      return failure(
        new MauvaiseCommandeError(
          'Une Animation Collective cloturée ne peut plus etre supprimée.'
        )
      )
    }
    await this.rendezVousRepository.delete(command.idRendezVous)

    this.notificationService.notifierLesJeunesDuRdv(
      rendezVous,
      Notification.Type.DELETED_RENDEZVOUS
    )

    try {
      await this.planificateurService.supprimerRappelsParId(rendezVous.id)
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
      this.mailService.envoyerMailRendezVous(
        createur,
        rendezVous,
        RendezVous.Operation.SUPPRESSION
      )
    }
    return emptySuccess()
  }

  async authorize(
    command: DeleteRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.rendezVousAuthorizer.authorize(
      command.idRendezVous,
      utilisateur
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: DeleteRendezVousCommand
  ): Promise<void> {
    const rdv = await this.rendezVousRepository.getSoftDeleted(
      command.idRendezVous
    )

    const codeEvenement =
      rdv && RendezVous.estUnTypeAnimationCollective(rdv.type)
        ? Evenement.Code.ANIMATION_COLLECTIVE_SUPPRIMEE
        : Evenement.Code.RDV_SUPPRIME

    await this.evenementService.creer(codeEvenement, utilisateur)
  }
}
