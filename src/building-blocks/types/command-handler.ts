import { Authentification } from '../../domain/authentification'

/**
 * Implémente la logique nécessaire à la réalisation de la commande envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export abstract class CommandHandler<C, T> {
  async execute(
    command: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<T> {
    await this.authorize(command, utilisateur)
    return this.handle(command)
  }

  abstract handle(command: C): Promise<T>
  abstract authorize(
    command: C,
    utilisateur?: Authentification.Utilisateur
  ): Promise<void>
}
