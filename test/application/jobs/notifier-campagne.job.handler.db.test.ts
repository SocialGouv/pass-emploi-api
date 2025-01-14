import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect } from 'chai'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { NotifierCampagneJobHandler } from '../../../src/application/jobs/notifier-campagne.job.handler.db'
import { Core } from '../../../src/domain/core'
import { Notification } from '../../../src/domain/notification/notification'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { CampagneSqlModel } from '../../../src/infrastructure/sequelize/models/campagne.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { ReponseCampagneSqlModel } from '../../../src/infrastructure/sequelize/models/reponse-campagne.sql-model'
import { DateService } from '../../../src/utils/date-service'
import {
  uneCampagne,
  uneEvaluationIncompleteDTO
} from '../../fixtures/campagne.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { StubbedClass, createSandbox, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('NotifierCampagneJobHandler', () => {
  let sandbox: SinonSandbox
  let notificationRepository: StubbedType<Notification.Repository>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateService: StubbedClass<DateService>
  let handler: NotifierCampagneJobHandler

  const campagneLongue = uneCampagne({
    dateFin: DateTime.now().plus({ days: 10 })
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    sandbox = createSandbox()
    notificationRepository = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())

    handler = new NotifierCampagneJobHandler(
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
      await CampagneSqlModel.create(campagneLongue)
      const job = {
        contenu: {
          offset: 0,
          idCampagne: '721e2108-60f5-4a75-b102-04fe6a40e899',
          nbNotifsEnvoyees: 0
        }
      }

      // When
      const result = await handler.handle(
        job as Planificateur.Job<{
          offset: number
          idCampagne: string
          nbNotifsEnvoyees: number
        }>
      )

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        nbNotifsEnvoyees: 2,
        estLaDerniereExecution: true
      })
      expect(planificateurRepository.creerJob).not.to.have.been.called()
    })
    it("envoie notifications aux jeunes qui n'ont pas répondu", async () => {
      // Given
      await CampagneSqlModel.create(campagneLongue)
      await ReponseCampagneSqlModel.create(
        uneEvaluationIncompleteDTO('idJeune', campagneLongue.id)
      )
      const job = {
        contenu: {
          offset: 0,
          idCampagne: '721e2108-60f5-4a75-b102-04fe6a40e899',
          nbNotifsEnvoyees: 0
        }
      }

      // When
      const result = await handler.handle(
        job as Planificateur.Job<{
          offset: number
          idCampagne: string
          nbNotifsEnvoyees: number
        }>
      )

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        nbNotifsEnvoyees: 1,
        estLaDerniereExecution: true
      })
      expect(notificationRepository.send).to.have.been.calledOnceWithExactly(
        {
          token: 'token',
          notification: {
            title: "Que pensez-vous de l'application du CEJ 😀 ?",
            body: 'Donnez-nous votre avis !'
          },
          data: { type: 'CAMPAGNE' }
        },
        'idJeune2'
      )
      expect(planificateurRepository.creerJob).not.to.have.been.called()
    })
  })
})
