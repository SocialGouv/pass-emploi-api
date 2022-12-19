import { Injectable } from '@nestjs/common'
import { DroitsInsuffisants } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'
import { AgenceQueryModel } from './query-models/agence.query-model'
import Structure = Core.Structure
import { Op } from 'sequelize'

export interface GetAgenceQuery extends Query {
  structure: Structure
}

export const ID_AGENCE_MILO_JDD = '9999'

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
        structure: query.structure,
        id: {
          [Op.not]: ID_AGENCE_MILO_JDD
        }
      }
    })
    return sqlModels.map(sql => {
      return {
        id: sql.id,
        nom: sql.nomAgence,
        codeDepartement: sql.codeDepartement
      }
    })
  }

  async authorize(
    query: GetAgenceQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      utilisateur.type === Authentification.Type.CONSEILLER &&
      utilisateur.structure === query.structure
    ) {
      return emptySuccess()
    }
    return failure(new DroitsInsuffisants())
  }

  async monitor(): Promise<void> {
    return
  }
}
