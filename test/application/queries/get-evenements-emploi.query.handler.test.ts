import { SinonSandbox } from 'sinon'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { PoleEmploiClient } from 'src/infrastructure/clients/pole-emploi-client'
import {
  GetEvenementsEmploiQuery,
  GetEvenementsEmploiQueryHandler
} from 'src/application/queries/get-evenements-emploi.query.handler'
import { unEvenementEmploiDto } from 'test/fixtures/evenement-emploi.fixture'
import { desEvenementsEmploiQueryModel } from 'test/fixtures/query-models/evenement-emploi.query-model.fixtures'

describe('GetEvenementsEmploiQueryHandler', () => {
  let getEvenementsEmploiQueryHandler: GetEvenementsEmploiQueryHandler
  let sandbox: SinonSandbox
  let poleEmploiClient: StubbedClass<PoleEmploiClient>

  before(() => {
    sandbox = createSandbox()
    poleEmploiClient = stubClass(PoleEmploiClient)

    getEvenementsEmploiQueryHandler = new GetEvenementsEmploiQueryHandler(
      poleEmploiClient
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('avec tous les critères remplis', () => {
      it('retourne des offres', async () => {
        // Given
        const query: GetEvenementsEmploiQuery = {
          page: 1,
          limit: 10,
          codePostal: '75009'
        }

        poleEmploiClient.getEvenementsEmploi.resolves({
          totalElements: 1,
          content: [unEvenementEmploiDto()]
        })

        // When
        const result = await getEvenementsEmploiQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(desEvenementsEmploiQueryModel())
      })
    })
  })
})
