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
import { ActionQueryModel } from './query-models/actions.query-model'
import { RendezVousJeuneQueryModel } from './query-models/rendez-vous.query-model'

const NUMERO_DU_JOUR_SAMEDI = 6

export interface GetJeuneHomeSuiviQuery extends Query {
  idJeune: string
  maintenant: string
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
    const { dateDebut, dateFin } = this.recupererLesDatesDeLaPeriode(
      query.maintenant
    )

    const [actions, rendezVous] = await Promise.all([
      this.recupererLesActions(query, dateDebut, dateFin),
      this.recupererLesRendezVous(query, dateDebut, dateFin)
    ])
    return success({
      actions,
      rendezVous
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

  private recupererLesDatesDeLaPeriode(maintenant: string): {
    dateDebut: DateTime
    dateFin: DateTime
  } {
    let dateDebut = DateTime.fromISO(maintenant, {
      setZone: true
    }).startOf('day')
    while (dateDebut.weekday !== NUMERO_DU_JOUR_SAMEDI) {
      dateDebut = dateDebut.minus({ day: 1 })
    }
    const dateFin = dateDebut.plus({ day: 14 })
    return { dateDebut, dateFin }
  }

  private async recupererLesRendezVous(
    query: GetJeuneHomeSuiviQuery,
    dateDebut: DateTime,
    dateFin: DateTime
  ): Promise<RendezVousJeuneQueryModel[]> {
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
          [Op.gte]: dateDebut.toJSDate(),
          [Op.lte]: dateFin.toJSDate()
        }
      },
      order: [['date', 'ASC']]
    })

    return rendezVousSqlModel.map(fromSqlToRendezVousJeuneQueryModel)
  }

  private async recupererLesActions(
    query: GetJeuneHomeSuiviQuery,
    dateDebut: DateTime,
    dateFin: DateTime
  ): Promise<ActionQueryModel[]> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune,
        dateEcheance: {
          [Op.gte]: dateDebut.toJSDate(),
          [Op.lt]: dateFin.toJSDate()
        }
      },
      order: [['dateEcheance', 'ASC']]
    })

    return actionsSqlModel.map(fromSqlToActionQueryModel)
  }
}
