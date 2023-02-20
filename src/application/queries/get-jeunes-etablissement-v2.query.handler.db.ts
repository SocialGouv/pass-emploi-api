import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { Situation } from '../../infrastructure/sequelize/models/situations-milo.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { ConseillerEtablissementAuthorizer } from '../authorizers/authorize-conseiller-etablissement'
import { GetJeunesEtablissementV2QueryModel } from './query-models/agence.query-model'

interface JeuneEtablissementRawSql extends JeuneSqlModel {
  id: string
  nom: string
  prenom: string
  date_derniere_actualisation_token: Date | null
  situation_courante: Situation
  count: string
}

const NOMBRE_JEUNES_MAX = 10
const PAGE_PAR_DEFAUT = 1

export interface GetJeunesEtablissementV2Query extends Query {
  idEtablissement: string
  page?: number
  limit?: number
  q: string
}

@Injectable()
export class GetJeunesEtablissementV2QueryHandler extends QueryHandler<
  GetJeunesEtablissementV2Query,
  Result<GetJeunesEtablissementV2QueryModel>
> {
  constructor(
    private conseillerAgenceAuthorizer: ConseillerEtablissementAuthorizer,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetJeunesEtablissementV2QueryHandler')
  }

  async handle(
    query: GetJeunesEtablissementV2Query
  ): Promise<Result<GetJeunesEtablissementV2QueryModel>> {
    const limit = query.limit ?? NOMBRE_JEUNES_MAX
    const page = query.page ?? PAGE_PAR_DEFAUT

    const sqlJeunes: JeuneEtablissementRawSql[] = await this.sequelize.query(
      `SELECT
            jeune.id,
            jeune.nom,
            jeune.prenom,
            jeune.date_derniere_actualisation_token,
            situations_milo.situation_courante,
            SIMILARITY(CONCAT(jeune.nom, ' ', jeune.prenom), ?) AS "score",
            COUNT(*) OVER() AS "count"
      FROM "jeune"
      JOIN conseiller ON conseiller.id = jeune.id_conseiller
      LEFT JOIN situations_milo ON situations_milo.id_jeune = jeune.id
      WHERE SIMILARITY(CONCAT(jeune.nom, ' ', jeune.prenom), ?) > 0 AND conseiller.id_agence = ?
      GROUP BY jeune.id, conseiller.id, situations_milo.id
      ORDER BY "score" DESC
      OFFSET ?
      LIMIT ?;`,
      {
        replacements: [
          query.q,
          query.q,
          query.idEtablissement,
          (page - 1) * limit,
          limit
        ],
        type: QueryTypes.SELECT
      }
    )

    return success({
      pagination: {
        page,
        limit,
        total: sqlJeunes.length ? parseInt(sqlJeunes[0].count) : 0
      },
      resultats: sqlJeunes.map(jeuneSql => {
        return {
          jeune: {
            id: jeuneSql.id,
            nom: jeuneSql.nom,
            prenom: jeuneSql.prenom
          },
          situation: jeuneSql.situation_courante?.categorie,
          dateDerniereActivite:
            jeuneSql.date_derniere_actualisation_token?.toISOString()
        }
      })
    })
  }

  async authorize(
    { idEtablissement }: GetJeunesEtablissementV2Query,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAgenceAuthorizer.authorize(
      idEtablissement,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
