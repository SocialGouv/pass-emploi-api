import { Logger } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { LogEvent, LogEventKey } from './log.event'
import { failure, isSuccess, Result } from './result'

/**
 * Implémente la logique nécessaire à la réalisation de la commande envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export abstract class CommandHandler<C, T> {
  protected logger: Logger
  private commandName: string

  constructor(commandName: string) {
    this.commandName = commandName
    this.logger = new Logger(commandName)
  }

  async execute(
    command: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<Result<T>> {
    try {
      await this.authorize(command, utilisateur)

      const result = await this.handle(command)

      if (isSuccess(result)) {
        this.monitor(utilisateur, command).catch(error => {
          this.logger.error(error)
        })
      }
      this.logAfter(command, result, utilisateur)

      return result
    } catch (e) {
      this.logAfter(command, failure(e), utilisateur)
      throw e
    }
  }

  abstract handle(command: C): Promise<Result<T>>

  abstract authorize(
    command: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<void>

  abstract monitor(
    utilisateur?: Authentification.Utilisateur,
    command?: C
  ): Promise<void>

  protected logAfter(
    command: C,
    result: Result<T>,
    utilisateur?: Authentification.Utilisateur
  ): void {
    const event = new LogEvent(LogEventKey.COMMAND_EVENT, {
      handler: this.commandName,
      command,
      result,
      utilisateur
    })
    this.logger.log(event)
  }
}
