import { Logger } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { Query } from './query'

/**
 * Implémente la logique liée à la query envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export abstract class QueryHandler<Q extends Query | void, QM> {
  protected logger: Logger

  constructor() {
    this.logger = new Logger('QueryHandler')
  }

  async execute(
    query: Q,
    utilisateur?: Authentification.Utilisateur
  ): Promise<QM> {
    await this.authorize(query, utilisateur)

    const result = await this.handle(query)

    if (result) {
      this.monitor(utilisateur, query).catch(error => {
        this.logger.error(error)
      })
    }
    return result
  }
  abstract handle(query: Q): Promise<QM>
  abstract authorize(
    query: Q,
    utilisateur?: Authentification.Utilisateur
  ): Promise<void>
  abstract monitor(
    utilisateur?: Authentification.Utilisateur,
    query?: Q
  ): Promise<void>
}
