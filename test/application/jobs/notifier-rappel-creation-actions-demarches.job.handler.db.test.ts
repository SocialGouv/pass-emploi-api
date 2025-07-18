import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Notification } from 'src/domain/notification/notification'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { NotifierRappelCreationActionsDemarchesJobHandler } from '../../../src/application/jobs/notifier-rappel-creation-actions-demarches.job.handler.db'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { Evenement } from '../../../src/domain/evenement'
import { EvenementEngagementHebdoSqlModel } from '../../../src/infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { unEvenementEngagementDto } from '../../fixtures/sql-models/evenement-engagement.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'
import { Planificateur } from '../../../src/domain/planificateur'

const idJeune = 'j1'
const idJeune2 = 'j2'
const idJeune3 = 'j3'
const idJeune4 = 'j4'
const idJeune5 = 'j5'
const maintenant = uneDatetime()

describe('NotifierCreationActionsDemarchesJobHandler', () => {
  let notifierCreationActionsDemarchesJobHandler: NotifierRappelCreationActionsDemarchesJobHandler
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

    notifierCreationActionsDemarchesJobHandler =
      new NotifierRappelCreationActionsDemarchesJobHandler(
        databaseForTesting.sequelize,
        notificationService,
        suiviJobService,
        dateService,
        planificateurRepository
      )

    // Given - Jeunes
    await JeuneSqlModel.bulkCreate([
      // Des AEs mais pas de création d'action
      unJeuneDto({
        id: idJeune,
        idConseiller: undefined,
        pushNotificationToken: 'push1',
        structure: Core.Structure.MILO
      }),
      // Des AEs mais avec création action
      unJeuneDto({
        id: idJeune2,
        idConseiller: undefined,
        pushNotificationToken: 'push2',
        structure: Core.Structure.POLE_EMPLOI
      }),
      // Que des AEs création action
      unJeuneDto({
        id: idJeune3,
        idConseiller: undefined,
        pushNotificationToken: 'push3',
        structure: Core.Structure.POLE_EMPLOI
      }),
      // Aucun AE
      unJeuneDto({
        id: idJeune4,
        idConseiller: undefined,
        pushNotificationToken: 'push4',
        structure: Core.Structure.MILO
      }),
      // Pas de push notif
      unJeuneDto({
        id: idJeune5,
        idConseiller: undefined,
        pushNotificationToken: undefined,
        structure: Core.Structure.MILO
      })
    ])

    // Given - AE
    await EvenementEngagementHebdoSqlModel.bulkCreate([
      unEvenementEngagementDto({
        idUtilisateur: idJeune,
        code: Evenement.Code.ACTION_LISTE
      }),
      unEvenementEngagementDto({
        idUtilisateur: idJeune2,
        code: Evenement.Code.ACTION_LISTE
      }),
      unEvenementEngagementDto({
        idUtilisateur: idJeune2,
        code: Evenement.Code.ACTION_CREEE
      }),
      unEvenementEngagementDto({
        idUtilisateur: idJeune3,
        code: Evenement.Code.ACTION_CREEE
      }),
      unEvenementEngagementDto({
        idUtilisateur: idJeune5,
        code: Evenement.Code.ACTION_DETAIL
      }),
      unEvenementEngagementDto({
        idUtilisateur: 'conseiller',
        typeUtilisateur: Authentification.Type.CONSEILLER,
        code: Evenement.Code.ACTION_DETAIL
      })
    ])
  })

  describe('handle', () => {
    it('notifie uniquement les jeunes ayant que des AEs hors création action/démarches', async () => {
      // Given
      notificationService.notifierRappelCreationActionDemarche.resolves()

      // When
      const result = await notifierCreationActionsDemarchesJobHandler.handle()

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        nbJeunesNotifies: 3,
        estLaDerniereExecution: true
      })
      expect(
        notificationService.notifierRappelCreationActionDemarche
      ).to.have.been.calledThrice()
      expect(planificateurRepository.ajouterJob).not.to.have.been.called()
    })
  })
})
