import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import {
  GetResumeActionsDesJeunesDuConseillerQuery,
  GetResumeActionsDesJeunesDuConseillerQueryHandlerDb
} from '../../../src/application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler.db'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unResumeActionDUnJeune } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { Action } from '../../../src/domain/action/action'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('GetResumeActionsDesJeunesDuConseillerQueryHandler', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandlerDb
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getResumeActionsDesJeunesDuConseillerQueryHandler =
      new GetResumeActionsDesJeunesDuConseillerQueryHandlerDb(
        databaseForTesting.sequelize,
        conseillerAuthorizer
      )
  })

  afterEach(() => {
    sandbox.restore()
  })
  describe('handle', () => {
    it('renvoie les resumés des actions des jeunes du conseiller', async () => {
      // Given
      const idConseiller = '1'
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'FGHIJ',
          idConseiller
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'ABCDE',
          statut: Action.Statut.PAS_COMMENCEE
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'ABCDE',
          statut: Action.Statut.EN_COURS
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'FGHIJ',
          statut: Action.Statut.TERMINEE
        })
      )

      // When
      const actual =
        await getResumeActionsDesJeunesDuConseillerQueryHandler.handle({
          idConseiller
        })

      // Then
      expect(actual).to.have.deep.members([
        unResumeActionDUnJeune({
          jeuneId: 'ABCDE',
          todoActionsCount: 1,
          inProgressActionsCount: 1,
          doneActionsCount: 0
        }),
        unResumeActionDUnJeune({
          jeuneId: 'FGHIJ',
          todoActionsCount: 0,
          doneActionsCount: 1
        })
      ])
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetResumeActionsDesJeunesDuConseillerQuery = {
        idConseiller: utilisateur.id
      }

      // When
      await getResumeActionsDesJeunesDuConseillerQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        utilisateur.id,
        utilisateur
      )
    })
  })
})
