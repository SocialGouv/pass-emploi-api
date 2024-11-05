import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Mail, MailServiceToken } from '../../domain/mail'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../domain/milo/conseiller'
import { Notification } from '../../domain/notification/notification'
import {
  PlanificateurService,
  supprimerLesRappelsDeRendezVous
} from '../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousAuthorizer } from '../authorizers/rendezvous-authorizer'

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
    @Inject(ConseillerRepositoryToken)
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
    const icsSequence =
      await this.rendezVousRepository.getAndIncrementRendezVousIcsSequence(
        rendezVous.id
      )
    await this.rendezVousRepository.delete(command.idRendezVous)

    this.notificationService.notifierLesJeunesDuRdv(
      rendezVous,
      Notification.Type.DELETED_RENDEZVOUS
    )

    supprimerLesRappelsDeRendezVous(
      rendezVous.id,
      this.planificateurService,
      this.logger,
      this.apmService
    )

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
        RendezVous.Operation.SUPPRESSION,
        icsSequence
      )
    }
    return emptySuccess()
  }

  async authorize(
    command: DeleteRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
      command.idRendezVous,
      utilisateur
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: DeleteRendezVousCommand
  ): Promise<void> {
    const rdv = await RendezVousSqlModel.findByPk(command.idRendezVous, {
      attributes: ['type']
    })

    const codeEvenement =
      rdv && RendezVous.estUnTypeAnimationCollective(rdv.type)
        ? Evenement.Code.ANIMATION_COLLECTIVE_SUPPRIMEE
        : Evenement.Code.RDV_SUPPRIME

    await this.evenementService.creer(codeEvenement, utilisateur)
  }
}
