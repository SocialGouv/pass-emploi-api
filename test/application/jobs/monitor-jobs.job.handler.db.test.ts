import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RapportJob24h, SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { MonitorJobsJobHandler } from '../../../src/application/jobs/monitor-jobs.job.handler.db'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJobSqlModel } from '../../../src/infrastructure/sequelize/models/suivi-job.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('MonitorJobsJobHandler', () => {
  let monitorJobsJobHandler: MonitorJobsJobHandler
  let dateSevice: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  const maintenant = uneDatetime()

  beforeEach(async () => {
    await getDatabase().cleanPG()
    const sandbox: SinonSandbox = createSandbox()
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(maintenant)
    suiviJobService = stubInterface(sandbox)

    monitorJobsJobHandler = new MonitorJobsJobHandler(
      dateSevice,
      suiviJobService
    )
  })

  describe('handle', () => {
    describe('pour un job qui tourne une fois toutes les 24h', () => {
      it('envoie le rapport avec toutes les exécutions du job', async () => {
        // Given
        const jobType = Planificateur.JobType.NETTOYER_LES_DONNEES

        await SuiviJobSqlModel.create({
          jobType: jobType,
          dateExecution: maintenant.minus({ hours: 25 }).toJSDate(),
          succes: true,
          resultat: {},
          nbErreurs: 0,
          tempsExecution: 99999
        })
        await SuiviJobSqlModel.create({
          jobType: jobType,
          dateExecution: maintenant.minus({ hours: 5 }).toJSDate(),
          succes: true,
          resultat: {},
          nbErreurs: 0,
          tempsExecution: 1000
        })
        const expectedRapportJob: RapportJob24h = {
          jobType: jobType,
          nbExecutionsAttendues: 1,
          nbExecutions: 1,
          nbErreurs: 0,
          nbEchecs: 0
        }

        // When
        await monitorJobsJobHandler.handle()

        // Then
        const rapport: RapportJob24h[] = suiviJobService.envoyerRapport.getCall(
          0
        ).args[0] as RapportJob24h[]

        const rapportJob = rapport.find(job => job.jobType === jobType)
        expect(rapportJob).to.deep.equal(expectedRapportJob)
      })
      it("envoie le rapport quand le job n'a pas tourné", async () => {
        // Given
        const jobType = Planificateur.JobType.NETTOYER_LES_DONNEES

        const expectedRapportJob: RapportJob24h = {
          jobType: jobType,
          nbExecutionsAttendues: 1,
          nbExecutions: 0,
          nbErreurs: 0,
          nbEchecs: 0
        }

        // When
        await monitorJobsJobHandler.handle()

        // Then
        const rapport: RapportJob24h[] = suiviJobService.envoyerRapport.getCall(
          0
        ).args[0] as RapportJob24h[]
        const rapportJob = rapport.find(job => job.jobType === jobType)
        expect(rapportJob).to.deep.equal(expectedRapportJob)
      })
    })
    describe('pour un job qui tourne plusieurs fois toutes les 24h', () => {
      it('envoie le rapport avec toutes les exécutions du job', async () => {
        // Given
        const jobType = Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE

        await SuiviJobSqlModel.create({
          jobType: jobType,
          dateExecution: maintenant.minus({ hours: 2 }).toJSDate(),
          succes: true,
          resultat: {},
          nbErreurs: 1,
          tempsExecution: 200
        })
        await SuiviJobSqlModel.create({
          jobType: jobType,
          dateExecution: maintenant.minus({ hours: 4 }).toJSDate(),
          succes: true,
          resultat: {},
          nbErreurs: 3,
          tempsExecution: 1000
        })
        await SuiviJobSqlModel.create({
          jobType: jobType,
          dateExecution: maintenant.minus({ hours: 6 }).toJSDate(),
          succes: false,
          resultat: {},
          nbErreurs: 0,
          tempsExecution: 300
        })
        const expectedRapportJob: RapportJob24h = {
          jobType: jobType,
          nbExecutionsAttendues: 12,
          nbExecutions: 3,
          nbErreurs: 4,
          nbEchecs: 1
        }

        // When
        await monitorJobsJobHandler.handle()

        // Then
        const rapport: RapportJob24h[] = suiviJobService.envoyerRapport.getCall(
          0
        ).args[0] as RapportJob24h[]

        const rapportJob = rapport.find(job => job.jobType === jobType)
        expect(rapportJob).to.deep.equal(expectedRapportJob)
      })
    })
  })
})
