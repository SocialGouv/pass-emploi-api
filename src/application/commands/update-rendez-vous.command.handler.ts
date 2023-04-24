import { Inject, Injectable } from '@nestjs/common'
import { Core } from '../../domain/core'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Mail, MailServiceToken } from '../../domain/mail'
import { Notification } from '../../domain/notification/notification'
import { PlanificateurService } from '../../domain/planificateur'
import {
  JeuneDuRendezVous,
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous/rendez-vous'
import { buildError } from '../../utils/logger.module'
import { RendezVousAuthorizer } from '../authorizers/rendezvous-authorizer'
import { HistoriqueRendezVousRepositoryToken } from '../../domain/rendez-vous/historique'

export interface UpdateRendezVousCommand extends Command {
  idRendezVous: string
  idsJeunes: string[]
  titre?: string
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  adresse?: string
  organisme?: string
  presenceConseiller: boolean
  nombreMaxParticipants?: number
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
    private rendezVousService: RendezVous.Service,
    private notificationService: Notification.Service,
    @Inject(MailServiceToken)
    private mailClient: Mail.Service,
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    private rendezVousAuthorizer: RendezVousAuthorizer,
    private planificateurService: PlanificateurService,
    private evenementService: EvenementService,
    private historiqueRendezVousFactory: RendezVous.Historique.Factory,
    @Inject(HistoriqueRendezVousRepositoryToken)
    private historiqueRendezVousRepository: RendezVous.Historique.Repository
  ) {
    super('UpdateRendezVousCommandHandler')
  }

  async handle(command: UpdateRendezVousCommand): Promise<Result<Core.Id>> {
    const rendezVous = await this.rendezVousRepository.get(command.idRendezVous)
    if (!rendezVous) {
      return failure(new NonTrouveError('RendezVous', command.idRendezVous))
    }

    const jeunes = await this.jeuneRepository.findAll(command.idsJeunes)

    if (jeunes.length !== command.idsJeunes?.length) {
      return failure(new NonTrouveError('Jeune'))
    }

    const result = this.rendezVousService.mettreAJour(rendezVous, {
      ...command,
      jeunes
    })

    if (isFailure(result)) {
      return result
    }
    const rendezVousUpdated = result.data
    await this.rendezVousRepository.save(rendezVousUpdated)

    this.replanifierLesRappelsDeRendezVous(rendezVousUpdated, rendezVous)
    this.notifierLesJeunes(rendezVous, rendezVousUpdated)
    if (rendezVousUpdated.invitation) {
      this.envoyerLesInvitationsCalendaires(
        rendezVousUpdated,
        RendezVous.Operation.MODIFICATION
      )
    }
    return success({ id: rendezVousUpdated.id })
  }

  private async envoyerLesInvitationsCalendaires(
    rendezVousUpdated: RendezVous,
    operation: RendezVous.Operation
  ): Promise<void> {
    const conseillerDestinataire = await this.conseillerRepository.get(
      rendezVousUpdated.createur.id
    )
    if (conseillerDestinataire && conseillerDestinataire.email) {
      try {
        await this.mailClient.envoyerMailRendezVous(
          conseillerDestinataire,
          rendezVousUpdated,
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

    const rdvMisAJour = {
      ...rendezVous,
      jeunes: jeunesAnciens.filter(jeuneAncien =>
        idsJeunesRdvUpdated.includes(jeuneAncien.id)
      )
    }
    const rdvSupprime = {
      ...rendezVous,
      jeunes: jeunesAnciens.filter(
        jeuneAncien => !idsJeunesRdvUpdated.includes(jeuneAncien.id)
      )
    }

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
    const nouveauRdv = {
      ...rendezVous,
      jeunes: jeunesAjoutes
    }

    this.notificationService.notifierLesJeunesDuRdv(
      rdvSupprime,
      Notification.Type.DELETED_RENDEZVOUS
    )
    this.notificationService.notifierLesJeunesDuRdv(
      nouveauRdv,
      Notification.Type.NEW_RENDEZVOUS
    )
    if (this.doitNotifierDUneMiseAJour(rendezVous, rendezVousUpdated)) {
      this.notificationService.notifierLesJeunesDuRdv(
        rdvMisAJour,
        Notification.Type.UPDATED_RENDEZVOUS
      )
    }
  }

  private doitNotifierDUneMiseAJour(
    rendezVous: RendezVous,
    rendezVousUpdated: RendezVous
  ): boolean {
    return (
      rendezVous.date.getTime() !== rendezVousUpdated.date.getTime() ||
      rendezVous.duree !== rendezVousUpdated.duree ||
      rendezVous.adresse !== rendezVousUpdated.adresse
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
        await this.planificateurService.supprimerRappelsParId(
          rendezVousUpdated.id
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
  ): Promise<Result> {
    return this.rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
      command.idRendezVous,
      utilisateur
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: UpdateRendezVousCommand
  ): Promise<void> {
    const log = this.historiqueRendezVousFactory.creerLogModification(
      command.idRendezVous,
      utilisateur
    )
    await this.historiqueRendezVousRepository.save(log)
    await this.evenementService.creer(Evenement.Code.RDV_MODIFIE, utilisateur)
  }
}
