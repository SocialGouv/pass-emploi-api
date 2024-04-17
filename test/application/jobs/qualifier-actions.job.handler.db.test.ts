import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { QualifierActionsJobHandler } from '../../../src/application/jobs/qualifier-actions.job.handler.db'
import { Action } from '../../../src/domain/action/action'
import { SuiviJob } from '../../../src/domain/suivi-job'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDate, uneDatetime } from '../../fixtures/date.fixture'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { getDatabase } from '../../utils/database-for-testing'
import { uneAction } from '../../fixtures/action.fixture'
import { success } from '../../../src/building-blocks/types/result'

describe('QualifierActionsJobHandler', () => {
  let sandbox: SinonSandbox
  let qualifierActionsJobHandler: QualifierActionsJobHandler
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let actionRepository: StubbedType<Action.Repository>
  let actionFactory: StubbedClass<Action.Factory>

  const maintenant = uneDatetime()
  const idJeune = 'test'

  beforeEach(async () => {
    await getDatabase().cleanPG()
    sandbox = createSandbox()
    dateService = stubClass(DateService)
    actionRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    actionFactory = stubClass(Action.Factory)

    dateService.now.returns(maintenant)

    qualifierActionsJobHandler = new QualifierActionsJobHandler(
      dateService,
      suiviJobService,
      actionRepository,
      actionFactory
    )

    await ConseillerSqlModel.create(unConseillerDto({ id: '1' }))
    await JeuneSqlModel.create(unJeuneDto({ id: idJeune }))
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('qualifie', async () => {
      // Given

      await ActionSqlModel.bulkCreate([
        uneActionDto({
          idJeune,
          statut: Action.Statut.PAS_COMMENCEE,
          dateEcheance: maintenant.minus({ months: 4, days: 1 }).toJSDate()
        }),
        uneActionDto({
          idJeune,
          statut: Action.Statut.EN_COURS,
          dateEcheance: maintenant.minus({ months: 4, days: 1 }).toJSDate()
        }),
        uneActionDto({
          idJeune,
          statut: Action.Statut.TERMINEE,
          dateEcheance: maintenant.minus({ months: 4, days: 1 }).toJSDate(),
          dateFinReelle: uneDate(),
          heuresQualifiees: 10
        }),
        uneActionDto({
          idJeune,
          statut: Action.Statut.TERMINEE,
          dateEcheance: maintenant.minus({ months: 4, days: 1 }).toJSDate(),
          dateFinReelle: uneDate()
        }),
        uneActionDto({
          idJeune,
          statut: Action.Statut.ANNULEE,
          dateEcheance: maintenant.minus({ months: 4, days: 1 }).toJSDate()
        }),
        uneActionDto({
          idJeune,
          statut: Action.Statut.PAS_COMMENCEE,
          dateEcheance: maintenant.minus({ months: 4 }).toJSDate()
        }),
        uneActionDto({
          idJeune,
          statut: Action.Statut.EN_COURS,
          dateEcheance: maintenant.minus({ months: 4 }).toJSDate()
        })
      ])

      actionFactory.updateAction.returns(
        success(
          uneAction({
            idJeune,
            statut: Action.Statut.TERMINEE,
            dateEcheance: maintenant.minus({ months: 4, days: 1 }),
            dateFinReelle: uneDatetime()
          })
        )
      )

      // When
      const result = await qualifierActionsJobHandler.handle()

      // Then
      expect(result.resultat).to.deep.equal({
        nbErreursCatchees: 0,
        nbFailuresUpdate: 0,
        nbFailuresQualification: 0,
        nombreActionsQualifiees: 3
      })
    })
  })
})
