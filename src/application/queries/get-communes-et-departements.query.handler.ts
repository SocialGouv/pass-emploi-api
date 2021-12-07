import { Inject, Injectable } from '@nestjs/common'
import { remove as enleveLesCaracteresSpeciaux } from 'remove-accents'
import { QueryTypes, Sequelize } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { CommuneSqlModel } from '../../infrastructure/sequelize/models/commune.sql-model'
import { DepartementSqlModel } from '../../infrastructure/sequelize/models/departement.sql-model'
import { SequelizeInjectionToken } from '../../infrastructure/sequelize/providers'
import { CommunesEtDepartementsQueryModel } from './query-models/communes-et-departements.query-model'

export interface GetCommunesEtDepartementsQuery extends Query {
  recherche: string
}

@Injectable()
export class GetCommunesEtDepartementsQueryHandler
  implements
    QueryHandler<
      GetCommunesEtDepartementsQuery,
      CommunesEtDepartementsQueryModel[]
    >
{
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {}

  async execute(
    query: GetCommunesEtDepartementsQuery
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const sanitizedQuery: GetCommunesEtDepartementsQuery = {
      recherche: enleveLesCaracteresSpeciaux(query.recherche)
    }
    const departements = await this.findDepartements(sanitizedQuery)
    const communes = await this.findCommunes(sanitizedQuery)
    const resultats = departements.concat(communes)

    resultats.sort((a, b) => {
      return a.score > b.score ? -1 : 1
    })
    resultats.splice(5, resultats.length)

    return resultats
  }

  private async findDepartements(
    query: GetCommunesEtDepartementsQuery
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const departements: DepartementSqlModel[] = await this.sequelize.query(
      `SELECT libelle, code, SIMILARITY(libelle, ?) AS "score"
       FROM "departement"
       WHERE libelle % ?
       ORDER BY "score" DESC LIMIT 5;`,
      {
        replacements: [query.recherche, query.recherche],
        type: QueryTypes.SELECT
      }
    )
    return departements.map(departement => ({
      libelle: departement.libelle,
      code: departement.code,
      type: CommunesEtDepartementsQueryModel.Type.DEPARTEMENT,
      score: departement.score
    }))
  }

  private async findCommunes(
    query: GetCommunesEtDepartementsQuery
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const communes: CommuneSqlModel[] = await this.sequelize.query(
      `SELECT libelle, code, code_postal as "codePostal", SIMILARITY(libelle, ?) AS "score"
       FROM "commune"
       WHERE libelle % ?
       ORDER BY "score" DESC LIMIT 5;`,
      {
        replacements: [query.recherche, query.recherche],
        type: QueryTypes.SELECT
      }
    )
    return communes.map(commune => ({
      libelle: commune.libelle,
      code: commune.code,
      codePostal: commune.codePostal,
      type: CommunesEtDepartementsQueryModel.Type.COMMUNE,
      score: commune.score
    }))
  }
}
