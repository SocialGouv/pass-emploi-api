import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { AgenceQueryModel } from './query-models/agence.query-model'
import { Core } from '../../domain/core'
import Structure = Core.Structure
import { Authentification } from '../../domain/authentification'
import { Unauthorized } from '../../domain/erreur'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'

export interface GetAgenceQuery extends Query {
  structure: Structure
}

@Injectable()
export class GetAgencesQueryHandler extends QueryHandler<
  GetAgenceQuery,
  AgenceQueryModel[]
> {
  constructor() {
    super('GetAgencesQueryHandler')
  }

  async handle(query: GetAgenceQuery): Promise<AgenceQueryModel[]> {
    const sqlModels = await AgenceSqlModel.findAll({
      where: {
        structure: query.structure
      }
    })
    return sqlModels.map(sql => {
      return new AgenceQueryModel(sql.id, sql.nomAgence)
    })
  }

  async authorize(
    query: GetAgenceQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.structure === query.structure
    ) {
      return
    }
    throw new Unauthorized('Agences')
  }

  async monitor(): Promise<void> {
    return
  }
}
