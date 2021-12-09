import { Authentification } from 'src/domain/authentification'
import { Query } from './query'

/**
 * Implémente la logique liée à la query envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export abstract class QueryHandler<Q extends Query | void, QM> {
  async execute(
    query: Q,
    utilisateur?: Authentification.Utilisateur
  ): Promise<QM> {
    await this.authorize(query, utilisateur)
    return this.handle(query)
  }
  abstract handle(query: Q): Promise<QM>
  abstract authorize(
    query: Q,
    utilisateur?: Authentification.Utilisateur
  ): Promise<void>
}
