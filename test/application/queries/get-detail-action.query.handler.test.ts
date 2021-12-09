import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { uneAction } from 'test/fixtures/action.fixture'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../../src/application/queries/get-detail-action.query.handler'
import { ActionQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { Action } from '../../../src/domain/action'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { uneActionQueryModel } from '../../fixtures/query-models/action.query-model.fixtures'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDetailActionQueryHandler', () => {
  let actionsRepository: StubbedType<Action.Repository>
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let getDetailActionQueryHandler: GetDetailActionQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    actionsRepository = stubInterface(sandbox)
    actionAuthorizer = stubClass(ActionAuthorizer)

    getDetailActionQueryHandler = new GetDetailActionQueryHandler(
      actionsRepository,
      actionAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it("retourne le détail d'une action", async () => {
      // Given
      const idAction = 'idAction'
      const getDetailActionQuery: GetDetailActionQuery = {
        idAction
      }
      const actionQueryModel: ActionQueryModel = uneActionQueryModel({
        id: idAction
      })
      actionsRepository.getQueryModelById
        .withArgs(idAction)
        .resolves(actionQueryModel)
      const action = uneAction({
        id: '1'
      })
      actionsRepository.get.withArgs(idAction).resolves(action)

      // When
      const actual = await getDetailActionQueryHandler.handle(
        getDetailActionQuery
      )

      // Then
      expect(actual).to.deep.equal(actionQueryModel)
    })

    it("retourne undefined si l'action n'existe pas", async () => {
      // Given
      const idActionInexistante = 'idActionInexistante'
      const query: GetDetailActionQuery = {
        idAction: idActionInexistante
      }
      actionsRepository.getQueryModelById
        .withArgs(idActionInexistante)
        .resolves()

      // When
      const actual = await getDetailActionQueryHandler.handle(query)

      // Then
      expect(actual).to.equal(undefined)
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
