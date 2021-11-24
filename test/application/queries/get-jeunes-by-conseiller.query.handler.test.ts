import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetJeunesByConseillerQuery,
  GetJeunesByConseillerQueryHandler
} from 'src/application/queries/get-jeunes-by-conseiller.query.handler'
import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import { Jeune } from 'src/domain/jeune'
import { listeDetailJeuneQueryModel } from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { createSandbox, expect } from '../../utils'

describe('GetJeunesByConseillerQueryHandler', () => {
  let jeunesRepository: StubbedType<Jeune.Repository>
  let getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    jeunesRepository = stubInterface(sandbox)
    getJeunesByConseillerQueryHandler = new GetJeunesByConseillerQueryHandler(
      jeunesRepository
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('retourne un tableau de jeunes', async () => {
    // Given
    const idConseiller = 'idConseiller'
    const getJeunesByConseillerQuery: GetJeunesByConseillerQuery = {
      idConseiller
    }
    const conseillerEtSesJeunesQueryModel: DetailJeuneQueryModel[] =
      listeDetailJeuneQueryModel()

    jeunesRepository.getAllQueryModelsByConseiller
      .withArgs(idConseiller)
      .resolves(conseillerEtSesJeunesQueryModel)

    // When
    const actual = await getJeunesByConseillerQueryHandler.execute(
      getJeunesByConseillerQuery
    )

    // Then
    expect(actual).to.deep.equal(conseillerEtSesJeunesQueryModel)
  })
})
