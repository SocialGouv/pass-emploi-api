import { Inject, Injectable } from '@nestjs/common'
import { remove as enleverLesAccents } from 'remove-accents'
import { QueryTypes, Sequelize } from 'sequelize'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { CommuneSqlModel } from '../../infrastructure/sequelize/models/commune.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { MetiersRomeQueryModel } from './query-models/metiers-rome.query-model'

export interface GetMetiersRomeQuery extends Query {
  recherche: string
}

@Injectable()
export class GetMetiersRomeQueryHandler extends QueryHandler<
  GetMetiersRomeQuery,
  MetiersRomeQueryModel[]
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetMetiersRomeQueryHandler')
  }

  async handle(query: GetMetiersRomeQuery): Promise<MetiersRomeQueryModel[]> {
    const sanitizedRecherche = enleverLesAccents(query.recherche)
    const metiers: CommuneSqlModel[] = await this.sequelize.query(
      `SELECT code, libelle, SIMILARITY(libelle_sanitized, ?) AS "score"
       FROM "referentiel_metier_rome"
       WHERE libelle_sanitized % ?
       ORDER BY "score" DESC
       LIMIT 20;`,
      {
        replacements: [sanitizedRecherche, sanitizedRecherche],
        type: QueryTypes.SELECT
      }
    )
    return metiers.map(metier => {
      return {
        libelle: metier.libelle,
        code: metier.code,
        score: metier.score
      }
    })
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
