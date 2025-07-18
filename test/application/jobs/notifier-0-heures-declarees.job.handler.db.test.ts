import { SinonSandbox } from 'sinon'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { getDatabase } from '../../utils/database-for-testing'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { Notifier0HeuresDeclareesJobHandler } from '../../../src/application/jobs/notifier-0-heures-declarees.job.handler.db'
import { Planificateur } from '../../../src/domain/planificateur'
import { DateService } from '../../../src/utils/date-service'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { Notification } from '../../../src/domain/notification/notification'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'

describe('Notifier0HeuresDeclareesJobHandler', () => {
  let jobHandler: Notifier0HeuresDeclareesJobHandler
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let notificationService: StubbedClass<Notification.Service>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let sandbox: SinonSandbox
  const maintenant = uneDatetime()

  before(async () => {
    const database = getDatabase()
    await database.cleanPG()

    sandbox = createSandbox()
    notificationService = stubClass(Notification.Service)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    suiviJobService = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)

    jobHandler = new Notifier0HeuresDeclareesJobHandler(
      database.sequelize,
      notificationService,
      suiviJobService,
      dateService,
      planificateurRepository
    )

    // Given: Jeunes
    await JeuneSqlModel.bulkCreate([
      // Jeune avec 0 action cette semaine (doit être notifié)
      unJeuneDto({
        idConseiller: undefined,
        id: 'j1',
        structure: Core.Structure.MILO,
        dispositif: Jeune.Dispositif.CEJ,
        peutVoirLeComptageDesHeures: true,
        pushNotificationToken: 'token-j1',
        dateDerniereActualisationToken: maintenant
          .minus({ hours: 3 })
          .toJSDate()
      }),
      // Jeune avec action cette semaine (ne doit pas être notifié)
      unJeuneDto({
        idConseiller: undefined,
        id: 'j2',
        structure: Core.Structure.MILO,
        dispositif: Jeune.Dispositif.CEJ,
        peutVoirLeComptageDesHeures: true,
        pushNotificationToken: 'token-j2',
        dateDerniereActualisationToken: maintenant.minus({ days: 1 }).toJSDate()
      }),
      // Jeune sans push notif (ne doit pas être notifié)
      unJeuneDto({
        idConseiller: undefined,
        id: 'j3',
        structure: Core.Structure.MILO,
        dispositif: Jeune.Dispositif.CEJ,
        peutVoirLeComptageDesHeures: true,
        pushNotificationToken: null,
        dateDerniereActualisationToken: maintenant.minus({ days: 1 }).toJSDate()
      }),
      // Jeune structure différente (ne doit pas être notifié)
      unJeuneDto({
        idConseiller: undefined,
        id: 'j4',
        structure: Core.Structure.POLE_EMPLOI,
        dispositif: Jeune.Dispositif.CEJ,
        peutVoirLeComptageDesHeures: true,
        pushNotificationToken: 'token-j4',
        dateDerniereActualisationToken: maintenant.minus({ days: 1 }).toJSDate()
      }),
      // Jeune hors dispositif CEJ (ne doit pas être notifié)
      unJeuneDto({
        idConseiller: undefined,
        id: 'j5',
        structure: Core.Structure.MILO,
        dispositif: Jeune.Dispositif.PACEA,
        peutVoirLeComptageDesHeures: true,
        pushNotificationToken: 'token-j5',
        dateDerniereActualisationToken: maintenant.minus({ days: 1 }).toJSDate()
      })
    ])

    // Given: une action pour j2 (doit empêcher la notif)
    await ActionSqlModel.create(
      uneActionDto({
        idJeune: 'j2',
        dateCreation: maintenant.startOf('week').plus({ days: 1 }).toJSDate()
      })
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('notifie uniquement les jeunes MILO CEJ avec 0 action cette semaine et push token actif', async () => {
      // Given
      notificationService.notifier0Heures.resolves()

      // When
      const result = await jobHandler.handle()

      // Then
      expect(result.succes).to.be.true()
      expect(result.resultat).to.deep.equal({
        nbJeunesNotifies: 1,
        estLaDerniereExecution: true
      })
      expect(
        notificationService.notifier0Heures
      ).to.have.been.calledOnceWithExactly('j1', 'token-j1')
      expect(planificateurRepository.ajouterJob).not.to.have.been.called()
    })
  })
})
