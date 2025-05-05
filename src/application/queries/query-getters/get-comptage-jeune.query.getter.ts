import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Query } from '../../../building-blocks/types/query'
import { Result, success } from '../../../building-blocks/types/result'
import { DateService } from '../../../utils/date-service'
import { ActionSqlModel } from '../../../infrastructure/sequelize/models/action.sql-model'

export interface GetComptageJeuneQuery extends Query {
  idJeune: string
  accessToken: string
  calculerHeuresValidees: boolean
  dateDebut?: DateTime
  dateFin?: DateTime
}

@Injectable()
export class GetComptageJeuneQueryGetter {
  constructor(private dateService: DateService) {}

  async handle(
    query: GetComptageJeuneQuery
  ): Promise<Result<{ nbHeuresDeclarees?: number; nbHeuresValidees: number }>> {
    const resultat = { nbHeuresDeclarees: 0, nbHeuresValidees: 0 }

    if (query.calculerHeuresValidees) {
      const actions = await ActionSqlModel.findAll({where})
    }

    return success(resultat)
  }
}
