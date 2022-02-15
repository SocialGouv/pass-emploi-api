import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { PlanificateurService } from '../../domain/planificateur'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { IdService } from '../../utils/id-service'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { MailSendinblueClient } from '../../infrastructure/clients/mail-sendinblue.client'

export interface CreateRendezVousCommand extends Command {
  idJeune: string
  idConseiller: string
  commentaire?: string
  date: string
  duree: number
  modalite?: string
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
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private planificateurService: PlanificateurService,
    private evenementService: EvenementService,
    private mailSendinblueClient: MailSendinblueClient
  ) {
    super('CreateRendezVousCommandHandler')
  }

  async handle(command: CreateRendezVousCommand): Promise<Result<string>> {
    const jeune = await this.jeuneRepository.get(command.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    if (jeune.conseiller?.id !== command.idConseiller) {
      return failure(
        new JeuneNonLieAuConseillerError(command.idConseiller, command.idJeune)
      )
    }

    const rendezVous = RendezVous.createRendezVousConseiller(
      command,
      jeune,
      this.idService
    )
    await this.rendezVousRepository.save(rendezVous)

    if (jeune.pushNotificationToken) {
      const notification = Notification.createNouveauRdv(
        jeune.pushNotificationToken,
        rendezVous.id
      )
      await this.notificationRepository.send(notification)
    } else {
      this.logger.log(
        `Le jeune ${jeune.id} ne s'est jamais connecté sur l'application`
      )
    }

    if (!jeune.conseiller.email) {
      this.logger.warn(
        `Impossible d'envoyer un mail au conseiller ${command.idConseiller}, il n'existe pas`
      )
    } else {
      try {
        await this.mailSendinblueClient.envoyerMailNouveauRendezVous(
          jeune.conseiller,
          rendezVous
        )
      } catch (e) {
        this.logger.error(
          "erreur lors de l'envoie de l'email du nouveau rendez-vous",
          e
        )
      }
    }

    try {
      await this.planificateurService.planifierRappelsRendezVous(rendezVous)
    } catch (e) {
      this.logger.error(
        `La planification des notifications du rendez-vous ${rendezVous.id} a échoué`,
        e
      )
      this.apmService.captureError(e)
    }

    return success(rendezVous.id)
  }

  async authorize(
    command: CreateRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorize(
      command.idConseiller,
      utilisateur,
      command.idJeune
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.RDV_CREE,
      utilisateur
    )
  }
}
