import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from '../../domain/notification'
import { RendezVous, RendezVousRepositoryToken } from '../../domain/rendez-vous'
import { IdService } from '../../utils/id-service'

export interface CreateRendezVousCommand extends Command {
  idJeune: string
  idConseiller: string
  commentaire?: string
  date: string
  duree: number
  modalite: string
}

@Injectable()
export class CreateRendezVousCommandHandler
  implements CommandHandler<CreateRendezVousCommand, Result<string>>
{
  constructor(
    private idService: IdService,
    @Inject(RendezVousRepositoryToken)
    private rendezVousRepository: RendezVous.Repository,
    @Inject(JeunesRepositoryToken) private jeuneRepository: Jeune.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository
  ) {}

  async execute(command: CreateRendezVousCommand): Promise<Result<string>> {
    const jeune = await this.jeuneRepository.get(command.idJeune)

    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    if (jeune.conseiller.id !== command.idConseiller) {
      return failure(
        new JeuneNonLieAuConseillerError(command.idConseiller, command.idJeune)
      )
    }

    const rendezVous = RendezVous.createRendezVousConseiller(
      command,
      jeune,
      this.idService
    )
    await this.rendezVousRepository.add(rendezVous)

    if (jeune.pushNotificationToken) {
      const notification = Notification.createNouveauRdv(
        jeune.pushNotificationToken,
        rendezVous.id
      )
      await this.notificationRepository.send(notification)
    }

    return success(rendezVous.id)
  }
}
