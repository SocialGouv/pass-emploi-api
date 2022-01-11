import { Logger } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { isSuccess, Result } from './result'

/**
 * Implémente la logique nécessaire à la réalisation de la commande envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export abstract class CommandHandler<C, T> {
  protected logger: Logger

  constructor() {
    this.logger = new Logger('CommandHandler')
  }

  async execute(
    command: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<Result<T>> {
    await this.authorize(command, utilisateur)

    const result = await this.handle(command)

    if (isSuccess(result)) {
      this.monitor(utilisateur, command).catch(error => {
        this.logger.error(error)
      })
    }

    return result
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
}
