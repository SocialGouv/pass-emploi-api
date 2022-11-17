import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  ConseillerSansAgenceError,
  JeuneNonLieALAgenceError,
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Mail, MailServiceToken } from '../../domain/mail'
import { Notification } from '../../domain/notification/notification'
import { PlanificateurService } from '../../domain/planificateur'
import {
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'
import { IdService } from '../../utils/id-service'
import { buildError } from '../../utils/logger.module'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface CreateRendezVousCommand extends Command {
  idsJeunes: string[]
  idConseiller: string
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  titre?: string
  type?: string
  precision?: string
  adresse?: string
  organisme?: string
  presenceConseiller?: boolean
  invitation?: boolean
}

@Injectable()
export class CreateRendezVousCommandHandler extends CommandHandler<
  CreateRendezVousCommand,
  string
> {
  constructor(
    private idService: IdService,
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    private notificationService: Notification.Service,
    @Inject(MailServiceToken)
    private mailService: Mail.Service,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private planificateurService: PlanificateurService,
    private evenementService: EvenementService
  ) {
    super('CreateRendezVousCommandHandler')
  }

  async handle(command: CreateRendezVousCommand): Promise<Result<string>> {
    const conseiller = await this.conseillerRepository.get(command.idConseiller)
    const idAgence = conseiller!.agence?.id
    if (RendezVous.estUnTypeAnimationCollective(command.type) && !idAgence) {
      return failure(new ConseillerSansAgenceError(command.idConseiller))
    }

    const jeunes: Jeune[] = []

    for (const idJeune of command.idsJeunes) {
      const jeune = await this.jeuneRepository.get(idJeune, {
        avecConfiguration: true
      })
      if (!jeune) {
        return failure(new NonTrouveError('Jeune', idJeune))
      }
      if (RendezVous.estUnTypeAnimationCollective(command.type)) {
        if (jeune.conseiller?.idAgence !== idAgence) {
          return failure(new JeuneNonLieALAgenceError(jeune.id, idAgence!))
        }
      } else if (jeune.conseiller?.id !== command.idConseiller) {
        return failure(
          new JeuneNonLieAuConseillerError(command.idConseiller, jeune.id)
        )
      }
      jeunes.push(jeune)
    }

    const rendezVous = RendezVous.createRendezVousConseiller(
      command,
      jeunes,
      conseiller!,
      this.idService
    )
    await this.rendezVousRepository.save(rendezVous)

    this.notificationService.notifierLesJeunesDuRdv(
      rendezVous,
      Notification.Type.NEW_RENDEZVOUS
    )
    this.planifierLesRappelsDeRendezVous(rendezVous)
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

  private async planifierLesRappelsDeRendezVous(
    rendezVous: RendezVous
  ): Promise<void> {
    try {
      await this.planificateurService.planifierRappelsRendezVous(rendezVous)
    } catch (e) {
      this.logger.error(
        buildError(
          `La planification des notifications du rendez-vous ${rendezVous.id} a échoué`,
          e
        )
      )
      this.apmService.captureError(e)
    }
  }

  async authorize(
    command: CreateRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(
      command.idConseiller,
      utilisateur
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(Evenement.Code.RDV_CREE, utilisateur)
  }
}
