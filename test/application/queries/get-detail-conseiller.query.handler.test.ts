import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import {
  GetDetailConseillerQuery,
  GetDetailConseillerQueryHandler
} from '../../../src/application/queries/get-detail-conseiller.query.handler'
import { Conseiller } from '../../../src/domain/conseiller'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { createSandbox, expect } from '../../utils'

describe('GetDetailConseillerQueryHandler', () => {
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)
    getDetailConseillerQueryHandler = new GetDetailConseillerQueryHandler(
      conseillersRepository
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('retourne un conseiller', async () => {
    // Given
    const idConseiller = 'idConseiller'
    const getDetailConseillerQuery: GetDetailConseillerQuery = {
      idConseiller
    }
    const conseillerEtSesJeunesQueryModel: DetailConseillerQueryModel =
      detailConseillerQueryModel()
    conseillersRepository.getQueryModelById
      .withArgs(idConseiller)
      .resolves(conseillerEtSesJeunesQueryModel)

    // When
    const actual = await getDetailConseillerQueryHandler.execute(
      getDetailConseillerQuery
    )

    // Then
    expect(actual).to.deep.equal(conseillerEtSesJeunesQueryModel)
  })

  it("retourne undefined si le conseiller n'existe pas", async () => {
    // Given
    const idConseillerInexistante = 'idConseillerInexistant'
    const query: GetDetailConseillerQuery = {
      idConseiller: idConseillerInexistante
    }
    conseillersRepository.getQueryModelById
      .withArgs(idConseillerInexistante)
      .resolves()

    // When
    const actual = await getDetailConseillerQueryHandler.execute(query)

    // Then
    expect(actual).to.equal(undefined)
  })
})
