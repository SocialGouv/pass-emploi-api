import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  emptySuccess,
  Result,
  success
} from '../../building-blocks/types/result'
import { Query } from '../../building-blocks/types/query'
import { DateService } from '../../utils/date-service'
import {
  Action,
  ActionsRepositoryToken,
  NewAction
} from '../../domain/action/action'
import { Inject } from '@nestjs/common'
import { DateTime } from 'luxon'

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
  }
}

export class GetIndicateursPourConseillerQueryHandler extends QueryHandler<
  GetIndicateursPourConseillerQuery,
  Result<IndicateursPourConseillerQueryModel>
> {
  constructor(
    private dateService: DateService,
    @Inject(ActionsRepositoryToken)
    private actionRepository: Action.Repository
  ) {
    super('GetIndicateursPourConseillerQueryHandler')
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async handle(
    query: GetIndicateursPourConseillerQuery
  ): Promise<Result<IndicateursPourConseillerQueryModel>> {
    const dateTimeDebut = DateTime.fromISO(query.dateDebut, { setZone: true })
    const dateTimeFin = DateTime.fromISO(query.dateFin, { setZone: true })

    const actionsDuJeune = await this.actionRepository.findAllActionsByIdJeune(
      query.idJeune
    )
    const actionsDuJeuneDateTime = actionsDuJeune.map(action => {
      return {
        ...action,
        dateTimeCreation: DateTime.fromJSDate(action.dateCreation),
        dateTimeEcheance: DateTime.fromJSDate(action.dateEcheance),
        dateTimeFinReelle: action.dateFinReelle
          ? DateTime.fromJSDate(action.dateFinReelle!)
          : undefined
      }
    })

    const nombreActionsCreees = actionsDuJeuneDateTime.filter(action => {
      return this.lActionEstCreeeEntreLesDeuxDates(
        action,
        dateTimeDebut,
        dateTimeFin
      )
    }).length

    const nombreActionsEnRetard = actionsDuJeuneDateTime.filter(action => {
      return this.lActionEstEnRetard(action)
    }).length

    const nombreActionsTerminees = actionsDuJeuneDateTime.filter(action => {
      return this.lActionEstTermineeEntreLesDeuxDates(
        action,
        dateTimeDebut,
        dateTimeFin
      )
    }).length

    return success({
      actions: {
        creees: nombreActionsCreees,
        enRetard: nombreActionsEnRetard,
        terminees: nombreActionsTerminees
      }
    })
  }

  async monitor(): Promise<void> {
    return
  }

  private lActionEstTermineeEntreLesDeuxDates(
    action: NewAction,
    dateTimeDebut: DateTime,
    dateTimeFin: DateTime
  ): boolean {
    return Boolean(
      action.dateTimeFinReelle ??
        DateService.isBetweenDates(
          action.dateTimeFinReelle!,
          dateTimeDebut,
          dateTimeFin
        )
    )
  }

  private lActionEstEnRetard(action: NewAction): boolean {
    return (
      action.dateTimeEcheance < this.dateService.now() &&
      action.statut !== Action.Statut.TERMINEE &&
      action.statut !== Action.Statut.ANNULEE
    )
  }

  private lActionEstCreeeEntreLesDeuxDates(
    action: NewAction,
    dateTimeDebut: DateTime,
    dateTimeFin: DateTime
  ): boolean {
    return DateService.isBetweenDates(
      action.dateTimeCreation,
      dateTimeDebut,
      dateTimeFin
    )
  }
}
