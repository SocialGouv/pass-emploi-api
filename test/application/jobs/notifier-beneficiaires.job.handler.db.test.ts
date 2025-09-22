import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { Notification } from '../../../src/domain/notification/notification'
import { Planificateur } from '../../../src/domain/planificateur'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { NotifierBeneficiairesJobHandler } from '../../../src/application/jobs/notifier-beneficiaires.job.handler.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import JobType = Planificateur.JobType
import { Core } from '../../../src/domain/core'

const idJeune1 = 'j1'
const idJeune2 = 'j2'
const idJeune3 = 'j3'
const idJeune4 = 'j4'
const idJeune5 = 'j5'
const maintenant = uneDatetime()

describe('NotifierBeneficiairesJobHandler', () => {
  let handler: NotifierBeneficiairesJobHandler
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let notificationService: StubbedClass<Notification.Service>
  let planificateurRepository: StubbedType<Planificateur.Repository>

  before(async () => {
    const databaseForTesting = getDatabase()
    await databaseForTesting.cleanPG()

    const sandbox: SinonSandbox = createSandbox()
    notificationService = stubClass(Notification.Service)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    suiviJobService = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)

    handler = new NotifierBeneficiairesJobHandler(
      databaseForTesting.sequelize,
      notificationService,
      suiviJobService,
      dateService,
      planificateurRepository
    )

    // Given - Conseillers
    await ConseillerSqlModel.bulkCreate([
      unConseillerDto({
        id: 'con1'
      })
    ])
    // Given - Jeunes
    await JeuneSqlModel.bulkCreate([
      unJeuneDto({
        id: idJeune1,
        idConseiller: 'con1',
        pushNotificationToken: 'push1',
        structure: Core.Structure.POLE_EMPLOI_AIJ
      }),
      unJeuneDto({
        id: idJeune2,
        idConseiller: 'con1',
        pushNotificationToken: null,
        structure: Core.Structure.POLE_EMPLOI_AIJ
      }),
      unJeuneDto({
        id: idJeune3,
        idConseiller: 'con1',
        pushNotificationToken: 'push3',
        structure: Core.Structure.MILO
      }),
      unJeuneDto({
        id: idJeune4,
        idConseiller: 'con1',
        pushNotificationToken: 'push4',
        structure: Core.Structure.POLE_EMPLOI_BRSA
      }),
      unJeuneDto({
        id: idJeune5,
        idConseiller: 'con1',
        pushNotificationToken: 'push5',
        structure: Core.Structure.POLE_EMPLOI_AIJ
      })
    ])
  })

  describe('handle', () => {
    it('envoie une notification aux bénéficiaires de la bonne structure', async () => {
      // Given
      const maintenant = uneDatetime()
      const job: Planificateur.Job<Planificateur.JobNotifierBeneficiaires> = {
        dateExecution: maintenant.toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          type: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: true,
          batchSize: 2,
          minutesEntreLesBatchs: 5
        }
      }

      // When
      const result = await handler.handle(job)

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        estLaDerniereExecution: false,
        nbBeneficiairesNotifies: 2
      })
      expect(
        notificationService.notifierBeneficiaires
      ).to.have.been.calledTwice()
      expect(
        notificationService.notifierBeneficiaires.firstCall
      ).to.have.been.calledWithExactly(
        idJeune1,
        'push1',
        'Une notification très importante',
        "C'est incroyable"
      )
      expect(
        notificationService.notifierBeneficiaires.secondCall
      ).to.have.been.calledWithExactly(
        idJeune4,
        'push4',
        'Une notification très importante',
        "C'est incroyable"
      )
      expect(planificateurRepository.ajouterJob).to.have.been.calledWith({
        dateExecution: maintenant.plus({ minute: 5 }).toJSDate(),
        type: JobType.NOTIFIER_BENEFICIAIRES,
        contenu: {
          type: Notification.Type.OUTILS,
          titre: 'Une notification très importante',
          description: "C'est incroyable",
          structures: [
            Core.Structure.POLE_EMPLOI_AIJ,
            Core.Structure.POLE_EMPLOI_BRSA
          ],
          push: true,
          batchSize: 2,
          minutesEntreLesBatchs: 5,
          offset: 2,
          nbBeneficiairesNotifies: 2
        }
      })
    })
  })
})
