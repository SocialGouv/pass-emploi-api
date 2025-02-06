import { Logger } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { Authentification } from '../../domain/authentification'
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
export abstract class CommandHandler<C, R, A = void> {
  protected logger: Logger
  protected apmService: APM.Agent
  private commandName: string

  constructor(commandName: string) {
    this.commandName = commandName
    this.logger = new Logger(commandName)
    this.apmService = getAPMInstance()
  }

  async execute(
    command?: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<Result<R>> {
    try {
      const aggregate = await this.getAggregate(command, utilisateur)

      const authorizerResult = await this.authorize(
        command,
        utilisateur,
        aggregate
      )
      if (isFailure(authorizerResult)) {
        return authorizerResult
      }

      const result = await this.handle(command, utilisateur, aggregate)

      if (isSuccess(result)) {
        this.monitor(utilisateur, command, aggregate).catch(error => {
          this.apmService.captureError(error)
          this.logger.error(error)
        })
      }
      this.logAfter(result, command, utilisateur)

      return result
    } catch (e) {
      this.logAfter(failure(e), command, utilisateur)
      throw e
    }
  }

  // FIXME return Result
  async getAggregate(
    _command?: C,
    _utilisateur?: Authentification.Utilisateur
  ): Promise<A | undefined> {
    return undefined
  }

  abstract authorize(
    command?: C,
    utilisateur?: Authentification.Utilisateur,
    aggregate?: A
  ): Promise<Result>

  abstract handle(
    command?: C,
    utilisateur?: Authentification.Utilisateur,
    aggregate?: A
  ): Promise<Result<R>>

  abstract monitor(
    utilisateur?: Authentification.Utilisateur,
    command?: C,
    aggregate?: A
  ): Promise<void>

  protected logAfter(
    result: Result<R>,
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
