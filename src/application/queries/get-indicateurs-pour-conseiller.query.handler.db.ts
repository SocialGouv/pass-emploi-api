import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { DateService } from '../../utils/date-service'
import { Action } from '../../domain/action/action'
import { DateTime } from 'luxon'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { RendezVousSqlModel } from '../../infrastructure/sequelize/models/rendez-vous.sql-model'
import { JeuneSqlModel } from '../../infrastructure/sequelize/models/jeune.sql-model'

export interface GetIndicateursPourConseillerQuery extends Query {
  idJeune: string
  dateDebut: string
  dateFin: string
}

export interface IndicateursPourConseillerQueryModel {
  actions: {
    creees: number
    enRetard: number
    terminees: number
    aEcheance: number
  }
  rendezVous: {
    planifies: number
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
    const maintenant = this.dateService.nowJs()
    const dateDebut = DateTime.fromISO(query.dateDebut, {
      setZone: true
    }).toJSDate()
    const dateFin = DateTime.fromISO(query.dateFin, {
      setZone: true
    }).toJSDate()

    const actionsSqlDuJeune: ActionSqlModel[] = await ActionSqlModel.findAll({
      where: {
        idJeune: query.idJeune
      }
    })
    const indicateursActions = this.getIndicateursActions(
      actionsSqlDuJeune,
      dateDebut,
      dateFin,
      maintenant
    )

    const rendezVousSqlDuJeune: RendezVousSqlModel[] =
      await RendezVousSqlModel.findAll({
        include: [
          {
            model: JeuneSqlModel,
            where: { id: query.idJeune }
          }
        ]
      })
    const nombreRendezVousPlanifies = rendezVousSqlDuJeune.filter(
      rendezVousSql => {
        return this.leRendezVousEntreLesDeuxDates(
          rendezVousSql,
          dateDebut,
          dateFin
        )
      }
    ).length

    return success({
      actions: indicateursActions,
      rendezVous: {
        planifies: nombreRendezVousPlanifies
      }
    })
  }

  private getIndicateursActions(
    actionsSqlDuJeune: ActionSqlModel[],
    dateDebut: Date,
    dateFin: Date,
    maintenant: Date
  ): {
    creees: number
    enRetard: number
    terminees: number
    aEcheance: number
  } {
    const indicateursActionsResult = actionsSqlDuJeune
      .map(actionSql => {
        return {
          creees: this.lActionEstCreeeEntreLesDeuxDates(
            actionSql,
            dateDebut,
            dateFin
          )
            ? 1
            : 0,
          enRetard: this.lActionEstEnRetard(actionSql, maintenant) ? 1 : 0,
          terminees: this.lActionEstTermineeEntreLesDeuxDates(
            actionSql,
            dateDebut,
            dateFin
          )
            ? 1
            : 0,
          aEcheance: this.lActionEstAEcheanceEntreLesDeuxDates(
            actionSql,
            dateDebut,
            dateFin
          )
            ? 1
            : 0
        }
      })
      .reduce(
        (indicateursActionsAccumulateur, indicateursAction) => {
          indicateursActionsAccumulateur.creees += indicateursAction.creees
          indicateursActionsAccumulateur.enRetard += indicateursAction.enRetard
          indicateursActionsAccumulateur.terminees +=
            indicateursAction.terminees
          indicateursActionsAccumulateur.aEcheance +=
            indicateursAction.aEcheance
          return indicateursActionsAccumulateur
        },
        {
          creees: 0,
          enRetard: 0,
          terminees: 0,
          aEcheance: 0
        }
      )
    return indicateursActionsResult
  }

  async monitor(): Promise<void> {
    return
  }

  private lActionEstTermineeEntreLesDeuxDates(
    actionSql: ActionSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return Boolean(
      actionSql.dateFinReelle ??
        DateService.isBetweenDates(actionSql.dateFinReelle!, dateDebut, dateFin)
    )
  }

  private lActionEstEnRetard(
    actionSql: ActionSqlModel,
    maintenant: Date
  ): boolean {
    return (
      actionSql.dateEcheance < maintenant &&
      actionSql.statut !== Action.Statut.TERMINEE &&
      actionSql.statut !== Action.Statut.ANNULEE
    )
  }

  private lActionEstCreeeEntreLesDeuxDates(
    actionSql: ActionSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return DateService.isBetweenDates(
      actionSql.dateCreation,
      dateDebut,
      dateFin
    )
  }

  private lActionEstAEcheanceEntreLesDeuxDates(
    actionSql: ActionSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return DateService.isBetweenDates(
      actionSql.dateEcheance,
      dateDebut,
      dateFin
    )
  }

  private leRendezVousEntreLesDeuxDates(
    rendezVousSql: RendezVousSqlModel,
    dateDebut: Date,
    dateFin: Date
  ): boolean {
    return DateService.isBetweenDates(rendezVousSql.date, dateDebut, dateFin)
  }
}
