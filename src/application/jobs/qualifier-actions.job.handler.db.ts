import { Inject, Injectable } from '@nestjs/common'
import { Job } from 'bull'
import { DateTime } from 'luxon'
import { Op, WhereOptions } from 'sequelize'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { isFailure } from '../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../domain/action/action'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'
import { ActionSqlRepository } from '../../infrastructure/repositories/action/action-sql.repository.db'
import { ActionSqlModel } from '../../infrastructure/sequelize/models/action.sql-model'
import { DateService } from '../../utils/date-service'

@Injectable()
@ProcessJobType(Planificateur.JobType.QUALIFIER_ACTIONS)
export class QualifierActionsJobHandler extends JobHandler<Job> {
  constructor(
    private dateService: DateService,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service,
    @Inject(ActionRepositoryToken)
    private readonly actionRepository: Action.Repository,
    private actionFactory: Action.Factory
  ) {
    super(Planificateur.JobType.QUALIFIER_ACTIONS, suiviJobService)
  }

  async handle(): Promise<SuiviJob> {
    const maintenant = this.dateService.now()
    let nbErreursCatchees = 0
    let nbFailuresUpdate = 0
    let nbFailuresQualification = 0
    let nombreActionsQualifiees = 0

    try {
      const actionsInProgress = await ActionSqlModel.findAll({
        where: actionsNonAnnuleesAvecDateEcheanceSuperieureA4Mois(maintenant)
      })

      for (const actionSql of actionsInProgress) {
        const action = ActionSqlRepository.actionFromSqlModel(actionSql)
        let actionAQualifier: Action = action

        if (action.statut !== Action.Statut.TERMINEE) {
          const updateResult = this.actionFactory.updateAction(action, {
            idAction: action.id,
            statut: Action.Statut.TERMINEE,
            dateFinReelle: this.dateService.now()
          })
          if (isFailure(updateResult)) {
            this.logger.warn(updateResult.error.message)
            nbFailuresUpdate++
            continue
          }
          actionAQualifier = updateResult?.data
        }

        const qualifierResult = Action.qualifier(
          actionAQualifier,
          Action.Qualification.Code.NON_SNP
        )
        if (isFailure(qualifierResult)) {
          nbFailuresQualification++
          this.logger.warn(qualifierResult.error.message)
          continue
        }
        await this.actionRepository.save(qualifierResult.data)
        nombreActionsQualifiees++
      }
    } catch (e) {
      this.logger.error(e.message)
      nbErreursCatchees++
    }

    return {
      jobType: this.jobType,
      nbErreurs: nbErreursCatchees + nbFailuresQualification + nbFailuresUpdate,
      succes: true,
      dateExecution: maintenant,
      tempsExecution: DateService.calculerTempsExecution(maintenant),
      resultat: {
        nbErreursCatchees,
        nbFailuresUpdate,
        nbFailuresQualification,
        nombreActionsQualifiees
      }
    }
  }
}

function actionsNonAnnuleesAvecDateEcheanceSuperieureA4Mois(
  maintenant: DateTime
): WhereOptions {
  return {
    statut: {
      [Op.in]: [
        Action.Statut.PAS_COMMENCEE,
        Action.Statut.EN_COURS,
        Action.Statut.TERMINEE
      ]
    },
    dateEcheance: { [Op.lt]: maintenant.minus({ months: 4 }).toJSDate() }
  }
}
