import { Inject, Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { QueryTypes, Sequelize } from 'sequelize'
import { Query } from '../../../building-blocks/types/query'
import { QueryHandler } from '../../../building-blocks/types/query-handler'
import { Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Situation } from '../../../infrastructure/sequelize/models/situations-milo.sql-model'
import { SequelizeInjectionToken } from '../../../infrastructure/sequelize/providers'
import { ConseillerInterStructureMiloAuthorizer } from '../../authorizers/conseiller-inter-structure-milo-authorizer'
import { PaginationQueryModel } from '../query-models/common/pagination.query-model'
import { JeuneMiloResumeQueryModel } from '../query-models/jeunes.query-model'

interface JeuneByStructureMiloRawSql {
  id_jeune: string
  nom_jeune: string
  prenom_jeune: string
  id_conseiller: string
  prenom_conseiller: string
  nom_conseiller: string
  date_derniere_actualisation_token: Date | null
  situation_courante: Situation
  count: string
}

const NOMBRE_JEUNES_MAX = 10
const DEFAULT_PAGE = 1

export class GetJeunesByStructureMiloQueryModel {
  @ApiProperty({ type: PaginationQueryModel })
  pagination: PaginationQueryModel

  @ApiProperty({ type: JeuneMiloResumeQueryModel, isArray: true })
  resultats: JeuneMiloResumeQueryModel[]
}

export interface GetJeunesByStructureMiloQuery extends Query {
  idStructureMilo: string
  page?: number
  limit?: number
  q?: string
}

@Injectable()
export class GetJeunesByStructureMiloQueryHandler extends QueryHandler<
  GetJeunesByStructureMiloQuery,
  Result<GetJeunesByStructureMiloQueryModel>
> {
  constructor(
    private conseillerInterStructureMiloAuthorizer: ConseillerInterStructureMiloAuthorizer,
    @Inject(SequelizeInjectionToken)
    private readonly sequelize: Sequelize
  ) {
    super('GetJeunesByStructureMiloQueryHandler')
  }

  async handle(
    query: GetJeunesByStructureMiloQuery
  ): Promise<Result<GetJeunesByStructureMiloQueryModel>> {
    const page = query.page
    const limit = query.page ? query.limit ?? NOMBRE_JEUNES_MAX : undefined
    const recherche = query.q

    let replacements: unknown[] = []

    let rechercheSelect = ''
    let rechercheWhere = ''
    let rechercheOrder = ''
    if (recherche) {
      rechercheSelect = `SIMILARITY(CONCAT(jeune.nom, ' ', jeune.prenom), ?) AS "score",`
      rechercheWhere = `SIMILARITY(CONCAT(jeune.nom, ' ', jeune.prenom), ?) > 0.1 AND`
      rechercheOrder = `ORDER BY "score" DESC`
      replacements = [recherche, recherche]
    }

    replacements.push(query.idStructureMilo)

    let paginationSql = ''
    if (page && limit) {
      paginationSql = `OFFSET ? 
      LIMIT ?`
      replacements = replacements.concat([(page - 1) * limit, limit])
    }

    const sqlJeunes: JeuneByStructureMiloRawSql[] = await this.sequelize.query(
      `SELECT
      jeune.id as id_jeune,
      jeune.nom as nom_jeune,
      jeune.prenom as prenom_jeune,
      conseiller.id as id_conseiller,
      conseiller.prenom as prenom_conseiller,
      conseiller.nom as nom_conseiller,
      jeune.date_derniere_actualisation_token,
      situations_milo.situation_courante,
      ${rechercheSelect}
      COUNT(*) OVER() AS "count"
      FROM jeune
      JOIN conseiller ON conseiller.id = jeune.id_conseiller
      LEFT JOIN situations_milo ON situations_milo.id_jeune = jeune.id
      WHERE ${rechercheWhere} jeune.id_structure_milo = ? AND jeune.structure = 'MILO'
      GROUP BY jeune.id, conseiller.id, situations_milo.id
      ${rechercheOrder}
      ${paginationSql};`,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    )

    const total = sqlJeunes.length ? parseInt(sqlJeunes[0].count) : 0

    return success({
      pagination: {
        page: page ?? DEFAULT_PAGE,
        limit: limit ?? total,
        total
      },
      resultats: sqlJeunes.map(jeuneSql => {
        return {
          jeune: {
            id: jeuneSql.id_jeune,
            nom: jeuneSql.nom_jeune,
            prenom: jeuneSql.prenom_jeune
          },
          referent: {
            id: jeuneSql.id_conseiller,
            prenom: jeuneSql.prenom_conseiller,
            nom: jeuneSql.nom_conseiller
          },
          situation: jeuneSql.situation_courante?.categorie,
          dateDerniereActivite:
            jeuneSql.date_derniere_actualisation_token?.toISOString()
        }
      })
    })
  }

  async authorize(
    { idStructureMilo }: GetJeunesByStructureMiloQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerInterStructureMiloAuthorizer.autoriserConseillerPourUneStructureMilo(
      idStructureMilo,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
