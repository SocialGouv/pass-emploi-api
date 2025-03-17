import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { SequelizeInjectionToken } from 'src/infrastructure/sequelize/providers'
import { DateService } from 'src/utils/date-service'
import { JobHandler } from '../../building-blocks/types/job-handler'
import { Planificateur, ProcessJobType } from '../../domain/planificateur'
import { SuiviJob, SuiviJobServiceToken } from '../../domain/suivi-job'

type CloreSessionsStats = {
  nombreSessionsCloses: number
  nombreSessionsCreees?: number
}

@Injectable()
@ProcessJobType(Planificateur.JobType.CLORE_SESSIONS)
export class CloreSessionsJobHandler extends JobHandler<
  Planificateur.Job<Planificateur.JobCloreSessions>
> {
  constructor(
    private readonly dateService: DateService,
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    @Inject(SuiviJobServiceToken)
    suiviJobService: SuiviJob.Service
  ) {
    super(Planificateur.JobType.CLORE_SESSIONS, suiviJobService)
  }

  async handle({
    contenu
  }: Planificateur.Job<Planificateur.JobCloreSessions>): Promise<SuiviJob> {
    const debutExecutionJob = this.dateService.now()
    const resultat: CloreSessionsStats = { nombreSessionsCloses: 0 }

    const query = `
        INSERT INTO session_milo (id, date_premiere_configuration, date_modification, date_cloture, id_structure_milo)
        VALUES :values
        ON CONFLICT (id) DO UPDATE
            SET date_modification = :dateExecution, date_cloture = :dateCloture
            WHERE session_milo.date_cloture IS NULL
        RETURNING date_premiere_configuration as datepremiereconfiguration;
    `

    const [rows, nbAffectedRows] = (await this.sequelize.query(query, {
      replacements: {
        values: contenu.idsSessions.map(id => [
          id,
          debutExecutionJob.toSQL(),
          debutExecutionJob.toSQL(),
          contenu.dateCloture,
          contenu.idStructureMilo
        ]),
        dateExecution: debutExecutionJob.toSQL(),
        dateCloture: contenu.dateCloture
      },
      type: QueryTypes.RAW
    })) as [Array<{ datepremiereconfiguration: Date }>, number]
    resultat.nombreSessionsCloses = nbAffectedRows

    const sessionsCreees = rows.filter(
      row =>
        row.datepremiereconfiguration.getTime() === debutExecutionJob.toMillis()
    )
    resultat.nombreSessionsCreees = sessionsCreees.length

    return {
      jobType: this.jobType,
      dateExecution: debutExecutionJob,
      succes: true,
      resultat,
      nbErreurs: 0,
      tempsExecution: DateService.calculerTempsExecution(debutExecutionJob)
    }
  }
}
