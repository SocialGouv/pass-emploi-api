import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../../domain/conseiller/conseiller'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import { Mail, MailServiceToken } from '../../../domain/mail'
import { Notification } from '../../../domain/notification/notification'
import {
  PlanificateurService,
  planifierLesRappelsDeRendezVous
} from '../../../domain/planificateur'
import {
  CodeTypeRendezVous,
  RendezVous,
  RendezVousRepositoryToken
} from '../../../domain/rendez-vous/rendez-vous'
import { buildError } from '../../../utils/logger.module'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { ConseillerMiloRepositoryToken } from '../../../domain/milo/conseiller.milo.db'
import {
  JeuneMilo,
  MiloJeuneRepositoryToken
} from '../../../domain/milo/jeune.milo'

export interface CreerRendezVousCommand extends Command {
  idsJeunes: string[]
  idConseiller: string
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  titre?: string
  type?: CodeTypeRendezVous
  precision?: string
  adresse?: string
  organisme?: string
  presenceConseiller?: boolean
  invitation?: boolean
  nombreMaxParticipants?: number
}

@Injectable()
export class CreerRendezVousCommandHandler extends CommandHandler<
  CreerRendezVousCommand,
  string
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(JeuneRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(MiloJeuneRepositoryToken)
    private jeuneMiloRepository: JeuneMilo.Repository,
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(ConseillerMiloRepositoryToken)
    private conseillerMiloRepository: Conseiller.Milo.Repository,
    private rendezVousFactory: RendezVous.Factory,
    private notificationService: Notification.Service,
    @Inject(MailServiceToken)
    private mailService: Mail.Service,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private planificateurService: PlanificateurService,
    private evenementService: EvenementService
  ) {
    super('CreerRendezVousCommandHandler')
  }

  async handle(command: CreerRendezVousCommand): Promise<Result<string>> {
    let conseiller
    let jeunes

    if (RendezVous.estUnTypeAnimationCollective(command.type)) {
      const conseillerResult = await this.conseillerMiloRepository.get(
        command.idConseiller
      )
      if (isFailure(conseillerResult)) {
        return conseillerResult
      }
      conseiller = conseillerResult.data
      jeunes = await this.jeuneMiloRepository.findAll(command.idsJeunes)
    } else {
      conseiller = await this.conseillerRepository.get(command.idConseiller)
      if (!conseiller) {
        return failure(new NonTrouveError('Conseiller'))
      }
      jeunes = await this.jeuneRepository.findAll(command.idsJeunes)
    }

    if (jeunes.length !== command.idsJeunes.length) {
      return failure(new NonTrouveError('Jeune'))
    }

    const result = this.rendezVousFactory.creer(command, jeunes, conseiller)

    if (isFailure(result)) {
      return result
    }

    const rendezVous = result.data

    await this.rendezVousRepository.save(rendezVous)

    this.notificationService.notifierLesJeunesDuRdv(
      rendezVous,
      Notification.Type.NEW_RENDEZVOUS
    )
    planifierLesRappelsDeRendezVous(
      rendezVous,
      this.planificateurService,
      this.logger,
      this.apmService
    )
    if (rendezVous.invitation) {
      this.envoyerLesInvitationsCalendaires(
        conseiller,
        rendezVous,
        RendezVous.Operation.CREATION
      )
    }
    return success(rendezVous.id)
  }

  private async envoyerLesInvitationsCalendaires(
    conseiller: Conseiller | undefined,
    rendezVous: RendezVous,
    operation: RendezVous.Operation
  ): Promise<void> {
    if (conseiller && conseiller.email) {
      try {
        await this.mailService.envoyerMailRendezVous(
          conseiller,
          rendezVous,
          operation
        )
      } catch (e) {
        this.logger.error(
          buildError(
            "Erreur lors de l'envoi de l'email du nouveau rendez-vous",
            e
          )
        )
      }
    } else {
      this.logger.warn(
        `Impossible d'envoyer un e-mail au conseiller ${conseiller?.id}, l'adresse n'existe pas`
      )
    }
  }

  async authorize(
    command: CreerRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreerRendezVousCommand
  ): Promise<void> {
    const codeEvenement = RendezVous.estUnTypeAnimationCollective(command.type)
      ? Evenement.Code.ANIMATION_COLLECTIVE_CREEE
      : Evenement.Code.RDV_CREE

    await this.evenementService.creer(codeEvenement, utilisateur)
  }
}
