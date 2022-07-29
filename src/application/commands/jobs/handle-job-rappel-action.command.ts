import { Inject, Injectable } from '@nestjs/common'
import { emptySuccess, Result, success } from 'src/building-blocks/types/result'
import { Action, ActionsRepositoryToken } from 'src/domain/action'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  Notification,
  NotificationRepositoryToken
} from '../../../domain/notification'
import { Planificateur } from '../../../domain/planificateur'

export interface HandleJobRappelActionCommand extends Command {
  job: Planificateur.Job<Planificateur.JobRappelAction>
}

export interface HandleJobRappelActionCommandResult {
  idAction?: string
  idJeune?: string
  notificationEnvoyee: boolean
}

@Injectable()
export class HandleJobRappelActionCommandHandler extends CommandHandler<
  HandleJobRappelActionCommand,
  HandleJobRappelActionCommandResult
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(NotificationRepositoryToken)
    private notificationRepository: Notification.Repository,
    private actionFactory: Action.Factory
  ) {
    super('HandleJobRappelActionCommandHandler')
  }

  async handle(
    command: HandleJobRappelActionCommand
  ): Promise<Result<HandleJobRappelActionCommandResult>> {
    const action = await this.actionRepository.get(command.job.contenu.idAction)

    const stats: HandleJobRappelActionCommandResult = {
      notificationEnvoyee: false
    }

    if (
      action &&
      this.actionFactory.doitEnvoyerUneNotificationDeRappel(action)
    ) {
      const jeune = await this.jeuneRepository.get(action.idJeune)

      if (jeune && jeune.pushNotificationToken) {
        const notification = Notification.creerNotificationRappelAction(
          jeune.pushNotificationToken,
          command.job.contenu.idAction
        )
        if (notification) {
          await this.notificationRepository.send(notification)
        }
        stats.idAction = action.id
        stats.idJeune = jeune.id
        stats.notificationEnvoyee = true
      } else {
        stats.idAction = action.id
        stats.idJeune = jeune?.id
      }
    }

    return success(stats)
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
