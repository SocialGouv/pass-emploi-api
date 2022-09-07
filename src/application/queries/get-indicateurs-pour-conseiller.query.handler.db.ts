import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { Op } from 'sequelize'

interface GetIndicateursPourConseillerQuery extends Query {
  idJeune: string
  dateDebut: Date
  dateFin: Date
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IndicateursPourConseillerQueryModel {}

export class GetIndicateursPourConseillerQueryHandler extends QueryHandler<
  GetIndicateursPourConseillerQuery,
  Result<IndicateursPourConseillerQueryModel>
> {
  constructor() {
    super('GetIndicateursPourConseillerQueryHandler')
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(
    query: GetIndicateursPourConseillerQuery
  ): Promise<Result<IndicateursPourConseillerQueryModel>> {
    const result = await ActionSqlModel.count({
      where: {
        idJeune: query.idJeune,
        dateCreation: { [Op.between]: [query.dateDebut, query.dateFin] }
      }
    })
    return success({ actions: { creees: result } })
  }

  async monitor(): Promise<void> {
    return
  }
}
