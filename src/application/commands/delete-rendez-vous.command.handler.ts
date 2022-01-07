import { Inject, Injectable } from '@nestjs/common'
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
import { PlanificateurService } from '../../domain/planificateur'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { RendezVousAuthorizer } from '../authorizers/authorize-rendezvous'

export interface DeleteRendezVousCommand extends Command {
  idRendezVous: string
}

@Injectable()
export class DeleteRendezVousCommandHandler extends CommandHandler<
  DeleteRendezVousCommand,
  Result
> {
  constructor(
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private readonly planificateurService: PlanificateurService,
    private rendezVousAuthorizer: RendezVousAuthorizer
  ) {
    super()
  }

  async handle(command: DeleteRendezVousCommand): Promise<Result> {
    const rendezVous = await this.rendezVousRepository.get(command.idRendezVous)
    if (!rendezVous) {
      return failure(new NonTrouveError('Rendez-Vous', command.idRendezVous))
    }
    await this.rendezVousRepository.delete(rendezVous.id)

    if (rendezVous.jeune.pushNotificationToken) {
      const notification = Notification.createRdvSupprime(
        rendezVous.jeune.pushNotificationToken,
        rendezVous.date
      )
      await this.notificationRepository.send(notification)
    }

    await this.planificateurService.supprimerRappelsRendezVous(rendezVous.id)
    return emptySuccess()
  }

  async authorize(
    command: DeleteRendezVousCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.rendezVousAuthorizer.authorize(command.idRendezVous, utilisateur)
  }
}
