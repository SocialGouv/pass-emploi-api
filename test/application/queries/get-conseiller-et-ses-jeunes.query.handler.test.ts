import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetConseillerEtSesJeunesQuery,
  GetConseillerEtSesJeunesQueryHandler
} from '../../../src/application/queries/get-conseiller-et-ses-jeunes.query.handler'
import {
  Conseiller,
  ConseillerEtSesJeunesQueryModel
} from '../../../src/domain/conseiller'
import { unConseillerEtSesJeunesQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { createSandbox, expect } from '../../utils'

describe('GetConseillerEtSesJeunesQueryHandler', () => {
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let getConseillerEtSesJeunesQueryHandler: GetConseillerEtSesJeunesQueryHandler
  let sandbox: SinonSandbox
  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)
    getConseillerEtSesJeunesQueryHandler =
      new GetConseillerEtSesJeunesQueryHandler(conseillersRepository)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('retourne un conseiller et ses jeunes', async () => {
    // Given
    const idConseiller = 'idConseiller'
    const getConseillerEtSesJeunesQuery: GetConseillerEtSesJeunesQuery = {
      idConseiller
    }
    const conseillerEtSesJeunesQueryModel: ConseillerEtSesJeunesQueryModel =
      unConseillerEtSesJeunesQueryModel()
    conseillersRepository.getAvecJeunes
      .withArgs(idConseiller)
      .resolves(conseillerEtSesJeunesQueryModel)

    // When
    const actual = await getConseillerEtSesJeunesQueryHandler.execute(
      getConseillerEtSesJeunesQuery
    )

    // Then
    expect(actual).to.deep.equal(conseillerEtSesJeunesQueryModel)
  })

  it("retourne undefined si l'action n'existe pas", async () => {
    // Given
    const idConseillerInexistante = 'idConseillerInexistant'
    const query: GetConseillerEtSesJeunesQuery = {
      idConseiller: idConseillerInexistante
    }
    conseillersRepository.getAvecJeunes
      .withArgs(idConseillerInexistante)
      .resolves()

    // When
    const actual = await getConseillerEtSesJeunesQueryHandler.execute(query)

    // Then
    expect(actual).to.equal(undefined)
  })
})
