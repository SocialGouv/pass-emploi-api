import { Query } from './query'

/**
 * Implémente la logique liée à la query envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export interface QueryHandler<Q extends Query | void, QM> {
  execute(query: Q): Promise<QM | undefined>
}
