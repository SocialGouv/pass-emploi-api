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
  RendezVous,
  RendezVousRepositoryToken
} from '../../domain/rendez-vous'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'

export interface UpdateRendezVousCommand extends Command {
  idRendezVous: string
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
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
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

    const rendezVousUpdated: RendezVous = {
      ...rendezVous,
      commentaire: command.commentaire,
      date: new Date(command.date),
      duree: command.duree,
      modalite: command.modalite,
      adresse: command.adresse,
      organisme: command.organisme,
      presenceConseiller: command.presenceConseiller
    }

    if (
      command.presenceConseiller === false &&
      rendezVous.type === CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
    ) {
      return failure(
        new MauvaiseCommandeError(
          'Le champ presenceConseiller ne peut etre modifé pour un rendez-vous Conseiller'
        )
      )
    }

    if (rendezVousUpdated.date.getTime() !== rendezVous.date.getTime()) {
      try {
        await this.planificateurService.supprimerRappelsRendezVous(
          rendezVousUpdated
        )
        await this.planificateurService.planifierRappelsRendezVous(
          rendezVousUpdated
        )
      } catch (e) {
        this.logger.error(
          `La replanification des notifications du rendez-vous ${rendezVousUpdated.id} a échoué`,
          e
        )
        this.apmService.captureError(e)
      }
    }

    await this.rendezVousRepository.save(rendezVousUpdated)

    const tokenDuJeune = rendezVous.jeune.pushNotificationToken
    if (tokenDuJeune) {
      const notification = Notification.updateRdv(
        tokenDuJeune,
        rendezVousUpdated.id
      )
      await this.notificationRepository.send(notification)
    } else {
      this.logger.log(
        `Le jeune ${rendezVous.jeune.id} ne s'est jamais connecté sur l'application`
      )
    }

    return success({ id: rendezVousUpdated.id })
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
