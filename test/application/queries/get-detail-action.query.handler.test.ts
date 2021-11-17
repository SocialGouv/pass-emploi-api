import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../../src/application/queries/get-detail-action.query.handler'
import { ActionQueryModel } from '../../../src/application/queries/query-models/action.query-model'
import { Action } from '../../../src/domain/action'
import { uneActionQueryModel } from '../../fixtures/query-models/action.query-model.fixtures'
import { createSandbox, expect } from '../../utils'

describe('GetDetailActionQueryHandler', () => {
  let actionsRepository: StubbedType<Action.Repository>
  let getDetailActionQueryHandler: GetDetailActionQueryHandler
  let sandbox: SinonSandbox
  before(() => {
    sandbox = createSandbox()
    actionsRepository = stubInterface(sandbox)
    getDetailActionQueryHandler = new GetDetailActionQueryHandler(
      actionsRepository
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  it("retourne le détail d'une action", async () => {
    // Given
    const idAction = 'idAction'
    const getDetailActionQuery: GetDetailActionQuery = { idAction }
    const actionQueryModel: ActionQueryModel = uneActionQueryModel({
      id: idAction
    })
    actionsRepository.getQueryModelById
      .withArgs(idAction)
      .resolves(actionQueryModel)

    // When
    const actual = await getDetailActionQueryHandler.execute(
      getDetailActionQuery
    )

    // Then
    expect(actual).to.deep.equal(actionQueryModel)
  })

  it("retourne undefined si l'action n'existe pas", async () => {
    // Given
    const idActionInexistante = 'idActionInexistante'
    const query: GetDetailActionQuery = { idAction: idActionInexistante }
    actionsRepository.getQueryModelById.withArgs(idActionInexistante).resolves()

    // When
    const actual = await getDetailActionQueryHandler.execute(query)

    // Then
    expect(actual).to.equal(undefined)
  })
})
