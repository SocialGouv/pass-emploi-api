import { SinonSandbox } from 'sinon'
import { uneAction } from 'test/fixtures/action.fixture'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../../src/application/queries/get-detail-action.query.handler.db'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { uneActionQueryModelWithJeuneFromDomain } from '../../fixtures/query-models/action.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { Action } from '../../../src/domain/action'
import { unJeune } from '../../fixtures/jeune.fixture'
import { ActionSqlRepository } from '../../../src/infrastructure/repositories/action-sql.repository.db'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository.db'
import { IdService } from '../../../src/utils/id-service'
import { DateService } from '../../../src/utils/date-service'
import { databaseForTesting } from '../../utils/'

describe('GetDetailActionQueryHandler', () => {
  let actionSqlRepository: Action.Repository
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let getDetailActionQueryHandler: GetDetailActionQueryHandler
  let sandbox: SinonSandbox
  const jeune = unJeune()

  before(() => {
    sandbox = createSandbox()
    actionAuthorizer = stubClass(ActionAuthorizer)
    actionSqlRepository = new ActionSqlRepository()

    getDetailActionQueryHandler = new GetDetailActionQueryHandler(
      actionAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    let action: Action

    beforeEach(async () => {
      const conseillerRepository = new ConseillerSqlRepository()
      await conseillerRepository.save(unConseiller())
      const jeuneRepository = new JeuneSqlRepository(
        databaseForTesting.sequelize,
        new IdService(),
        new DateService()
      )
      await jeuneRepository.save(jeune)

      action = uneAction({ idJeune: jeune.id })
      await actionSqlRepository.save(action)
    })

    describe("quand l'action existe", () => {
      it('retourne le query model', async () => {
        // When
        const actionQueryModel = await getDetailActionQueryHandler.handle({
          idAction: action.id
        })

        // Then
        expect(actionQueryModel).to.deep.equal(
          uneActionQueryModelWithJeuneFromDomain(action, jeune)
        )
      })
    })

    describe("quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const result = await getDetailActionQueryHandler.handle({
          idAction: 'b11e5d7b-a046-4e2a-9f78-ac54411593e9'
        })

        // Then
        expect(result).to.equal(undefined)
      })
    })
  })

  describe('authorize', () => {
    it('valide le conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      const query: GetDetailActionQuery = {
        idAction: 'id-action'
      }

      // When
      await getDetailActionQueryHandler.authorize(query, utilisateur)

      // Then
      expect(actionAuthorizer.authorize).to.have.been.calledWithExactly(
        'id-action',
        utilisateur
      )
    })
  })
})
