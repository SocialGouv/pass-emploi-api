import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { NotifierActualisationJobHandler } from '../../../src/application/jobs/notifier-actualisation.job.handler.db'
import { Core } from '../../../src/domain/core'
import { Notification } from '../../../src/domain/notification/notification'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { StubbedClass, createSandbox, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('NotifierActualisationJobHandler', () => {
  let sandbox: SinonSandbox
  let notificationRepository: StubbedType<Notification.Repository>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let handler: NotifierActualisationJobHandler

  beforeEach(async () => {
    await getDatabase().cleanPG()
    sandbox = createSandbox()
    notificationRepository = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)

    handler = new NotifierActualisationJobHandler(
      notificationRepository,
      suiviJobService,
      dateService,
      planificateurRepository
    )

    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: 'idJeune',
        structure: Core.Structure.MILO
      })
    )
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: 'idJeune2',
        structure: Core.Structure.POLE_EMPLOI
      })
    )
  })

  afterEach(async () => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('envoie notifications aux jeunes de la bonne structure', async () => {
      // Given
      dateService.now.returns(uneDatetime())
      const job = {
        contenu: {
          offset: 0,
          nbNotifsEnvoyees: 0,
          reprogrammmationPourLeLendemain: false
        }
      }

      // When
      const result = await handler.handle(
        job as Planificateur.Job<{
          offset: number
          reprogrammmationPourLeLendemain: boolean
          nbNotifsEnvoyees: number
        }>
      )

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        nbNotifsEnvoyees: 1,
        estLaDerniereExecution: true,
        reprogrammmationPourLeLendemain: false,
        totalBeneficiairesANotifier: 1
      })
      expect(planificateurRepository.ajouterJob).not.to.have.been.called()
    })
    it("replanifie quand c'est 18h passée", async () => {
      // Given
      dateService.now.returns(uneDatetime().set({ hour: 18 }))
      const job = {
        contenu: {
          offset: 0,
          nbNotifsEnvoyees: 0,
          reprogrammmationPourLeLendemain: false
        }
      }

      // When
      const result = await handler.handle(
        job as Planificateur.Job<{
          offset: number
          reprogrammmationPourLeLendemain: boolean
          nbNotifsEnvoyees: number
        }>
      )

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        nbNotifsEnvoyees: 0,
        estLaDerniereExecution: false,
        reprogrammmationPourLeLendemain: true,
        totalBeneficiairesANotifier: 0
      })
      expect(
        planificateurRepository.ajouterJob
      ).to.have.been.calledOnceWithExactly({
        dateExecution: uneDatetime()
          .plus({ days: 1 })
          .setZone('Europe/Paris')
          .set({ hour: 8 })
          .toJSDate(),
        type: Planificateur.JobType.NOTIFIER_ACTUALISATION,
        contenu: job.contenu
      })
    })
  })
})
