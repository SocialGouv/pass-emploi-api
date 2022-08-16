import { Injectable } from '@nestjs/common'
import { JeuneHomeSuiviQueryModel } from './query-models/home-jeune-suivi.query-model'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Authentification } from '../../domain/authentification'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { fromSqlToActionQueryModel } from 'src/infrastructure/repositories/mappers/actions.mappers'
import { Op } from 'sequelize'

export interface GetJeuneHomeSuiviQuery extends Query {
  idJeune: string
  dateDebut: Date
  dateFin: Date
}

@Injectable()
export class GetJeuneHomeSuiviQueryHandler extends QueryHandler<
  GetJeuneHomeSuiviQuery,
  Result<JeuneHomeSuiviQueryModel>
> {
  constructor() {
    super('GetJeuneHomeSuiviQueryHandler')
  }

  async handle(
    query: GetJeuneHomeSuiviQuery
  ): Promise<Result<JeuneHomeSuiviQueryModel>> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.gte]: query.dateDebut,
          [Op.lte]: query.dateFin
        }
      },
      order: [['dateEcheance', 'ASC']]
    })

    return success({ actions: actionsSqlModel.map(fromSqlToActionQueryModel) })
  }

  async authorize(
    _query: GetJeuneHomeSuiviQuery,
    _utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
