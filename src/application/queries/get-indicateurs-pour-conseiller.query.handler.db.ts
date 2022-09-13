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

    const nombreActionsCreees = actionsSqlDuJeune.filter(actionSql => {
      return this.lActionEstCreeeEntreLesDeuxDates(
        actionSql,
        dateDebut,
        dateFin
      )
    }).length

    const nombreActionsEnRetard = actionsSqlDuJeune.filter(actionSql => {
      return this.lActionEstEnRetard(actionSql, maintenant)
    }).length

    const nombreActionsTerminees = actionsSqlDuJeune.filter(actionSql => {
      return this.lActionEstTermineeEntreLesDeuxDates(
        actionSql,
        dateDebut,
        dateFin
      )
    }).length

    const nombreActionsAEcheance = actionsSqlDuJeune.filter(actionSql => {
      return this.lActionEstAEcheanceEntreLesDeuxDates(
        actionSql,
        dateDebut,
        dateFin
      )
    }).length

    return success({
      actions: {
        creees: nombreActionsCreees,
        enRetard: nombreActionsEnRetard,
        terminees: nombreActionsTerminees,
        aEcheance: nombreActionsAEcheance
      }
    })
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
}
