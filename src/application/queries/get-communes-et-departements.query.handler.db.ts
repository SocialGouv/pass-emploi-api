import { Inject, Injectable } from '@nestjs/common'
import { remove as enleverLesAccents } from 'remove-accents'
import { QueryTypes, Sequelize } from 'sequelize'
import { emptySuccess, Result } from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { CommuneSqlModel } from '../../infrastructure/sequelize/models/commune.sql-model'
import { DepartementSqlModel } from '../../infrastructure/sequelize/models/departement.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import {
  CommuneOuDepartementType,
  CommunesEtDepartementsQueryModel
} from './query-models/communes-et-departements.query-model'

export interface GetCommunesEtDepartementsQuery extends Query {
  recherche: string
  villesOnly?: boolean
}

@Injectable()
export class GetCommunesEtDepartementsQueryHandler extends QueryHandler<
  GetCommunesEtDepartementsQuery,
  CommunesEtDepartementsQueryModel[]
> {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {
    super('GetCommunesEtDepartementsQueryHandler')
  }

  async handle(
    query: GetCommunesEtDepartementsQuery
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const sanitizedRecherche = enleverLesAccents(query.recherche)
    const resultats = await this.findCommunes(sanitizedRecherche)
    if (!query.villesOnly) {
      const departements = await this.findDepartements(sanitizedRecherche)
      resultats.push(...departements)
    }

    resultats.sort((a, b) => {
      return a.score > b.score ? -1 : 1
    })
    resultats.splice(7, resultats.length)

    return resultats
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }

  private async findDepartements(
    recherche: string
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const departements: DepartementSqlModel[] = await this.sequelize.query(
      `SELECT libelle, code, SIMILARITY(libelle, ?) AS "score"
       FROM "departement"
       WHERE SIMILARITY(libelle, ?) > 0.4
       ORDER BY "score" DESC;`,
      {
        replacements: [recherche, recherche],
        type: QueryTypes.SELECT
      }
    )
    return departements.map(departement => ({
      libelle: departement.libelle,
      code: departement.code,
      type: CommuneOuDepartementType.DEPARTEMENT,
      score: departement.score
    }))
  }

  private async findCommunes(
    recherche: string
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const communes: CommuneSqlModel[] = await this.sequelize.query(
      `SELECT libelle, code, code_postal as "codePostal", longitude, latitude, SIMILARITY(libelle, ?) AS "score"
       FROM "commune"
       WHERE SIMILARITY(libelle, ?) > 0.4
       ORDER BY "score" DESC;`,
      {
        replacements: [recherche, recherche],
        type: QueryTypes.SELECT
      }
    )
    return communes.map(commune => {
      return {
        libelle: commune.libelle,
        code: commune.code,
        codePostal: commune.codePostal,
        type: CommuneOuDepartementType.COMMUNE,
        score: commune.score,
        longitude: Number.parseFloat(commune.longitude),
        latitude: Number.parseFloat(commune.latitude)
      }
    })
  }
}
