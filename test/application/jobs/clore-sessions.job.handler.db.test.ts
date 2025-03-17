import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { createSandbox } from 'sinon'
import { CloreSessionsJobHandler } from 'src/application/jobs/clore-sessions.job.handler.db'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { DateService } from 'src/utils/date-service'
import { uneStructureMiloDto } from 'test/fixtures/sql-models/structureMilo.sql-model'
import { expect, StubbedClass, stubClass } from 'test/utils'
import {
  DatabaseForTesting,
  getDatabase
} from 'test/utils/database-for-testing'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { uneDatetime } from '../../fixtures/date.fixture'

describe('CloreSessionsJobHandler', () => {
  let cloreSessionsJobHandler: CloreSessionsJobHandler
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let database: DatabaseForTesting

  const debutExecutionJob = DateTime.now()
  const structureMilo = uneStructureMiloDto({ timezone: 'America/Cayenne' })

  const idSessionsAClore = ['id-1', 'id-2', 'id-inexistant', 'id-session-close']

  before(() => {
    database = getDatabase()
  })

  beforeEach(async () => {
    await database.cleanPG()

    const sandbox = createSandbox()
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)

    cloreSessionsJobHandler = new CloreSessionsJobHandler(
      dateService,
      database.sequelize,
      suiviJobService
    )

    dateService.now.returns(debutExecutionJob)
  })

  describe('handle', () => {
    const dateCloture = uneDatetime().minus({ minute: 1 })
    const dateExecution = uneDatetime().toJSDate()
    const job: Planificateur.Job<Planificateur.JobCloreSessions> = {
      type: Planificateur.JobType.CLORE_SESSIONS,
      dateExecution,
      contenu: {
        idsSessions: idSessionsAClore,
        idStructureMilo: structureMilo.id,
        dateCloture: dateCloture.toJSDate()
      }
    }

    let suiviJob: SuiviJob
    beforeEach(async () => {
      // Given
      await StructureMiloSqlModel.create(structureMilo)

      await SessionMiloSqlModel.bulkCreate([
        {
          id: 'id-1',
          idStructureMilo: structureMilo.id,
          dateModification: debutExecutionJob.minus({ day: 1 }).toJSDate()
        },
        {
          id: 'id-2',
          idStructureMilo: structureMilo.id,
          dateModification: debutExecutionJob.minus({ day: 2 }).toJSDate()
        },
        {
          id: 'id-3',
          idStructureMilo: structureMilo.id,
          dateModification: debutExecutionJob.minus({ day: 3 }).toJSDate()
        },
        {
          id: 'id-session-close',
          idStructureMilo: structureMilo.id,
          dateModification: debutExecutionJob.minus({ day: 4 }).toJSDate(),
          dateCloture: debutExecutionJob.minus({ day: 4 }).toJSDate()
        }
      ])

      // When
      suiviJob = await cloreSessionsJobHandler.handle(job)
    })

    it('clos les sessions demandées existantes', async () => {
      // Then
      expect(await SessionMiloSqlModel.findByPk('id-1')).to.deep.include({
        dateModification: debutExecutionJob.toJSDate(),
        dateCloture: dateCloture.toJSDate()
      })
      expect(await SessionMiloSqlModel.findByPk('id-2')).to.deep.include({
        dateModification: debutExecutionJob.toJSDate(),
        dateCloture: dateCloture.toJSDate()
      })
      expect(await SessionMiloSqlModel.findByPk('id-3')).to.deep.include({
        dateModification: debutExecutionJob.minus({ day: 3 }).toJSDate(),
        dateCloture: null
      })
    })

    it('clos les sessions demandées inexistantes', async () => {
      // Then
      expect(
        await SessionMiloSqlModel.findByPk('id-inexistant')
      ).to.deep.include({
        id: 'id-inexistant',
        idStructureMilo: structureMilo.id,
        estVisible: false,
        autoinscription: false,
        dateModification: debutExecutionJob.toJSDate(),
        dateCloture: dateCloture.toJSDate()
      })
    })

    it('ne modifie pas les sessions déjà closes', async () => {
      // Then
      expect(
        await SessionMiloSqlModel.findByPk('id-session-close')
      ).to.deep.include({
        dateModification: debutExecutionJob.minus({ day: 4 }).toJSDate(),
        dateCloture: debutExecutionJob.minus({ day: 4 }).toJSDate()
      })
    })

    it('renvoie le résultat du job', async () => {
      // Then
      expect(suiviJob).to.deep.include({
        dateExecution: debutExecutionJob,
        jobType: 'CLORE_SESSIONS',
        nbErreurs: 0,
        resultat: { nombreSessionsCloses: 3, nombreSessionsCreees: 1 },
        succes: true
      })
    })
  })
})
