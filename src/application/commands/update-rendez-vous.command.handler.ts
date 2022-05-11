import { Inject, Injectable } from '@nestjs/common'
import { Core } from 'src/domain/core'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { PlanificateurService } from '../../domain/planificateur'
import {
  CodeTypeRendezVous,
  JeuneDuRendezVous,
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'
import { Mail, MailServiceToken } from '../../domain/mail'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { buildError } from '../../utils/logger.module'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'

export interface UpdateRendezVousCommand extends Command {
  idRendezVous: string
  idsJeunes?: string[]
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  adresse?: string
  organisme?: string
  presenceConseiller: boolean
}

@Injectable()
export class UpdateRendezVousCommandHandler extends CommandHandler<
  UpdateRendezVousCommand,
  Core.Id
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    @Inject(MailServiceToken)
    private mailClient: Mail.Service,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private planificateurService: PlanificateurService,
    private evenementService: EvenementService
  ) {
    super('UpdateRendezVousCommandHandler')
  }

  async handle(command: UpdateRendezVousCommand): Promise<Result<Core.Id>> {
    const rendezVous = await this.rendezVousRepository.get(command.idRendezVous)

    if (!rendezVous) {
      return failure(new NonTrouveError('RendezVous', command.idRendezVous))
    }

    if (
      !command.presenceConseiller &&
      rendezVous.type === CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
    ) {
      return failure(
        new MauvaiseCommandeError(
          'Le champ presenceConseiller ne peut etre modifé pour un rendez-vous Conseiller'
        )
      )
    }

    const jeunes: Jeune[] = []

    if (command.idsJeunes) {
      for (const idJeune of command.idsJeunes) {
        const jeune = await this.jeuneRepository.get(idJeune)
        if (!jeune) {
          return failure(new NonTrouveError('Jeune', idJeune))
        }
        jeunes.push(jeune)
      }
    }
    const rendezVousUpdated: RendezVous = await RendezVous.mettreAJour(
      rendezVous,
      {
        ...command,
        jeunes: command.idsJeunes ? jeunes : rendezVous.jeunes
      }
    )
    await this.rendezVousRepository.save(rendezVousUpdated)

    await this.replanifierLesRappelsDeRendezVous(rendezVousUpdated, rendezVous)
    await this.notifierLesJeunes(rendezVous, rendezVousUpdated)
    if (rendezVousUpdated.invitation) {
      await this.envoyerLesInvitationsCalendaires(rendezVousUpdated)
    }
    return success({ id: rendezVousUpdated.id })
  }

  private async envoyerLesInvitationsCalendaires(
    rendezVousUpdated: RendezVous
  ): Promise<void> {
    const conseillerDestinataire = await this.conseillerRepository.get(
      rendezVousUpdated.createur.id
    )
    if (conseillerDestinataire && conseillerDestinataire.email) {
      try {
        await this.mailClient.envoyerMailRendezVous(
          conseillerDestinataire,
          rendezVousUpdated,
          true
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
        `Impossible d'envoyer un e-mail au conseiller ${rendezVousUpdated.createur.id}, l'adresse n'existe pas`
      )
    }
  }

  private async notifierLesJeunes(
    rendezVous: RendezVous,
    rendezVousUpdated: RendezVous
  ): Promise<void> {
    const jeunesAnciens: JeuneDuRendezVous[] = rendezVous.jeunes
    const idsJeunesRdvUpdated: string[] = rendezVousUpdated.jeunes.map(
      jeune => jeune.id
    )

    const jeunesInchanges: JeuneDuRendezVous[] = jeunesAnciens.filter(
      jeuneAncien => idsJeunesRdvUpdated.includes(jeuneAncien.id)
    )
    const jeunesSupprimes: JeuneDuRendezVous[] = jeunesAnciens.filter(
      jeuneAncien => !idsJeunesRdvUpdated.includes(jeuneAncien.id)
    )

    const jeunesAjoutes: JeuneDuRendezVous[] = []
    for (const idJeune of idsJeunesRdvUpdated) {
      const estUnNouveauJeune = !jeunesAnciens.find(
        jeune => jeune.id === idJeune
      )
      if (estUnNouveauJeune) {
        const jeuneAjoute = await this.jeuneRepository.get(idJeune)
        jeunesAjoutes.push(jeuneAjoute!)
      }
    }

    jeunesAjoutes.forEach(jeune => {
      if (jeune.pushNotificationToken) {
        const notification = Notification.createNouveauRdv(
          jeune.pushNotificationToken,
          rendezVous.id
        )
        this.notificationRepository.send(notification)
      } else {
        this.logger.log(
          `Le jeune ${jeune.id} ne s'est jamais connecté sur l'application`
        )
      }
    })

    jeunesSupprimes.forEach(jeune => {
      if (jeune.pushNotificationToken) {
        const notification = Notification.createRdvSupprime(
          jeune.pushNotificationToken,
          rendezVous.date
        )
        this.notificationRepository.send(notification)
      } else {
        this.logger.log(
          `Le jeune ${jeune.id} ne s'est jamais connecté sur l'application`
        )
      }
    })

    if (
      this.beneficiairesNeSontPasModifies(jeunesAjoutes, jeunesSupprimes) &&
      this.infosRendezVousSontModifies(rendezVous, rendezVousUpdated)
    ) {
      jeunesInchanges.forEach(jeune => {
        if (jeune.pushNotificationToken) {
          const notification = Notification.createRendezVousMisAJour(
            jeune.pushNotificationToken,
            rendezVous.id
          )
          this.notificationRepository.send(notification)
        } else {
          this.logger.log(
            `Le jeune ${jeune.id} ne s'est jamais connecté sur l'application`
          )
        }
      })
    }
  }

  private beneficiairesNeSontPasModifies(
    jeunesAjoutes: JeuneDuRendezVous[],
    jeunesSupprimes: JeuneDuRendezVous[]
  ): boolean {
    return jeunesSupprimes.length === 0 && jeunesAjoutes.length === 0
  }
  private infosRendezVousSontModifies(
    rendezVous: RendezVous,
    rendezVousUpdated: RendezVous
  ): boolean {
    return (
      rendezVous.commentaire !== rendezVousUpdated.commentaire ||
      rendezVous.date.getTime() !== rendezVousUpdated.date.getTime() ||
      rendezVous.duree !== rendezVousUpdated.duree ||
      rendezVous.modalite !== rendezVousUpdated.modalite ||
      rendezVous.adresse !== rendezVousUpdated.adresse ||
      rendezVous.organisme !== rendezVousUpdated.organisme ||
      rendezVous.presenceConseiller !== rendezVousUpdated.presenceConseiller
    )
  }

  private async replanifierLesRappelsDeRendezVous(
    rendezVousUpdated: RendezVous,
    rendezVous: RendezVous
  ): Promise<void> {
    const laDateAEteModifiee =
      rendezVousUpdated.date.getTime() !== rendezVous.date.getTime()
    if (laDateAEteModifiee) {
      try {
        await this.planificateurService.supprimerRappelsRendezVous(
          rendezVousUpdated
        )
        await this.planificateurService.planifierRappelsRendezVous(
          rendezVousUpdated
        )
      } catch (e) {
        this.logger.error(
          buildError(
            `La replanification des notifications du rendez-vous ${rendezVousUpdated.id} a échoué`,
            e
          )
        )
        this.apmService.captureError(e)
      }
    }
  }

  async authorize(
    command: UpdateRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.rendezVousAuthorizer.authorize(command.idRendezVous, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.RDV_MODIFIE,
      utilisateur
    )
  }
}
