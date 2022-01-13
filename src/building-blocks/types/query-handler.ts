import { Logger } from '@nestjs/common'
import { Authentification } from 'src/domain/authentification'
import { LogEvent, LogEventKey } from './log.event'
import { Query } from './query'
import { emptySuccess, failure, Result } from './result'
import { getAPMInstance } from '../../infrastructure/monitoring/apm.init'
import * as APM from 'elastic-apm-node'

/**
 * Implémente la logique liée à la query envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
export abstract class QueryHandler<Q extends Query | void, QM> {
  protected logger: Logger
  private queryName: string
  private apmService: APM.Agent

  constructor(queryName: string) {
    this.logger = new Logger(queryName)
    this.queryName = queryName
    this.apmService = getAPMInstance()
  }

  async execute(
    query: Q,
    utilisateur?: Authentification.Utilisateur
  ): Promise<QM> {
    try {
      await this.authorize(query, utilisateur)

      const result = await this.handle(query)
      if (result) {
        this.monitor(utilisateur, query).catch(error => {
          this.apmService.captureError(error)
          this.logger.error(error)
        })
      }

      this.logAfter(query, emptySuccess(), utilisateur)
      return result
    } catch (e) {
      this.logAfter(query, failure(e), utilisateur)
      throw e
    }
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

  protected logAfter(
    query: Q,
    result: Result,
    utilisateur?: Authentification.Utilisateur
  ): void {
    const event = new LogEvent(LogEventKey.QUERY_EVENT, {
      handler: this.queryName,
      query,
      result,
      utilisateur
    })
    this.logger.log(event)
  }
}
