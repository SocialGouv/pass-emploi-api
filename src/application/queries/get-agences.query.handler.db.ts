import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core, getStructureDeReference } from '../../domain/core'
import { AgenceSqlModel } from '../../infrastructure/sequelize/models/agence.sql-model'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import Structure = Core.Structure
import { AgenceQueryModel } from './query-models/agence.query-model'

export interface GetAgenceQuery extends Query {
  structure: Structure
}

export const ID_AGENCE_MILO_JDD = '9999'

@Injectable()
export class GetAgencesQueryHandler extends QueryHandler<
  GetAgenceQuery,
  AgenceQueryModel[]
> {
  constructor(private readonly conseillerAuthorizer: ConseillerAuthorizer) {
    super('GetAgencesQueryHandler')
  }

  async handle(query: GetAgenceQuery): Promise<AgenceQueryModel[]> {
    const sqlModels = await AgenceSqlModel.findAll({
      where: {
        structure: getStructureDeReference(query.structure),
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
    return this.conseillerAuthorizer.autoriserToutConseiller(
      utilisateur,
      query.structure === utilisateur.structure
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
