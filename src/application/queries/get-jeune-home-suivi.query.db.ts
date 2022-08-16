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
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { fromSqlToRendezVousJeuneQueryModel } from './query-mappers/rendez-vous-milo.mappers'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerSqlModel } from '../../infrastructure/sequelize/models/conseiller.sql-model'
import { DateTime } from 'luxon'

export interface GetJeuneHomeSuiviQuery extends Query {
  idJeune: string
  maintenant: Date
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
    const dateDebut = query.maintenant
    const dateFin = DateTime.fromJSDate(dateDebut).plus({ day: 14 })

    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.gte]: dateDebut,
          [Op.lte]: dateFin
        }
      },
      order: [['dateEcheance', 'ASC']]
    })

    const rendezVousSqlModel = await RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: query.idJeune },
          include: [ConseillerSqlModel]
        }
      ],
      where: {
        date: {
          [Op.gte]: dateDebut,
          [Op.lte]: dateFin
        }
      },
      order: [['date', 'ASC']]
    })

    return success({
      actions: actionsSqlModel.map(fromSqlToActionQueryModel),
      rendezVous: rendezVousSqlModel.map(fromSqlToRendezVousJeuneQueryModel)
    })
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
