import { Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { Authentification } from '../../domain/authentification'
import { NotificationSupport } from '../../domain/notification-support'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import { LogEvent, LogEventKey } from './log.event'
import {
  Failure,
  failure,
  isFailure,
  isSuccess,
  Result,
  Success,
  success
} from './result'

/**
 * Implémente la logique nécessaire à la réalisation de la commande envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export abstract class CommandHandler<C, T> {
  protected logger: Logger
  protected apmService: APM.Agent
  private commandName: string
  private NotificationSupportService: NotificationSupport.Service | undefined

  constructor(
    commandName: string,
    NotificationSupportService?: NotificationSupport.Service
  ) {
    this.commandName = commandName
    this.logger = new Logger(commandName)
    this.apmService = getAPMInstance()
    this.NotificationSupportService = NotificationSupportService
  }

  async execute(
    command?: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<Result<T>> {
    try {
      const authorizedResult = await this.authorize(command, utilisateur)
      if (isFailure(authorizedResult)) {
        return authorizedResult
      }

      const result = await this.handle(command)

      if (isSuccess(result)) {
        this.monitor(utilisateur, command).catch(error => {
          this.apmService.captureError(error)
          this.logger.error(error)
        })
      }
      this.logAfter(result, command, utilisateur)
      await this.notifyAfter(result as Result)

      return result
    } catch (e) {
      this.logAfter(failure(e), command, utilisateur)
      await this.notifyAfter(failure(e))
      throw e
    }
  }

  abstract handle(command?: C): Promise<Result<T>>

  abstract authorize(
    command?: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<Result>

  abstract monitor(
    utilisateur?: Authentification.Utilisateur,
    command?: C
  ): Promise<void>

  protected logAfter(
    result: Result<T>,
    command?: C,
    utilisateur?: Authentification.Utilisateur
  ): void {
    const resultPourLog = construireResultPourLog(result)
    const commandSanitized = nettoyerLaCommand(command)

    const event = new LogEvent(LogEventKey.COMMAND_EVENT, {
      handler: this.commandName,
      command: commandSanitized,
      result: resultPourLog,
      utilisateur
    })
    this.logger.log(event)
  }

  protected async notifyAfter(result: Result): Promise<void> {
    const event = {
      job: this.commandName,
      result
    }
    await this.NotificationSupportService?.notifierResultatJob(event)
  }
}

function construireResultPourLog<T>(
  result: Success<T> | Failure
): Result<unknown> {
  if (isSuccess(result)) {
    return typeof result.data === 'object'
      ? result
      : success({
          value: result.data
        })
  }
  return result
}

function nettoyerLaCommand<C>(command: C | undefined): C | undefined {
  const commandSanitized = {
    ...command
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (commandSanitized && commandSanitized.fichier) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    commandSanitized.fichier = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ...commandSanitized.fichier,
      buffer: undefined
    }
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return commandSanitized
}
