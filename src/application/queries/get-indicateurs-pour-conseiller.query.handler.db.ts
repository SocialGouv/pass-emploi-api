import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { Op } from 'sequelize'
import { DateService } from '../../utils/date-service'
import { Action } from '../../domain/action/action'

export interface GetIndicateursPourConseillerQuery extends Query {
  idJeune: string
  dateDebut: string
  dateFin: string
}

export interface IndicateursPourConseillerQueryModel {
  actions: {
    creees: number
    terminees: number
  }
}

export class GetIndicateursPourConseillerQueryHandler extends QueryHandler<
  GetIndicateursPourConseillerQuery,
  Result<IndicateursPourConseillerQueryModel>
> {
  constructor(private dateService: DateService) {
    super('GetIndicateursPourConseillerQueryHandler')
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(
    query: GetIndicateursPourConseillerQuery
  ): Promise<Result<IndicateursPourConseillerQueryModel>> {
    const nombreActionsCreees = await ActionSqlModel.count({
      where: {
        idJeune: query.idJeune,
        dateCreation: { [Op.between]: [query.dateDebut, query.dateFin] }
      }
    })

    const nombreActionsEnRetard = await ActionSqlModel.count({
      where: {
        idJeune: query.idJeune,
        dateEcheance: { [Op.gt]: this.dateService.now() },
        statut: { [Op.notIn]: [Action.Statut.ANNULEE, Action.Statut.TERMINEE] }
      }
    })

    return success({
      actions: {
        creees: nombreActionsCreees,
        terminees: nombreActionsEnRetard
      }
    })
  }

  async monitor(): Promise<void> {
    return
  }
}
