import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { EvenementService } from 'src/domain/evenement'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../../src/application/queries/get-offres-immersion.query.handler'
import { OffreImmersionQueryModel } from '../../../src/application/queries/query-models/offres-immersion.query-models'
import { OffresImmersion } from '../../../src/domain/offre-immersion'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetOffresImmersionQueryHandler', () => {
  let offresImmersionRepository: StubbedType<OffresImmersion.Repository>
  let getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    getOffresImmersionQueryHandler = new GetOffresImmersionQueryHandler(
      offresImmersionRepository,
      evenementService
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne des offres', async () => {
      // Given
      const getOffresImmersionQuery: GetOffresImmersionQuery = {
        rome: 'D1102',
        lat: 48.502103949334845,
        lon: 2.13082255225161
      }
      const offresImmersionQueryModel: OffreImmersionQueryModel[] = [
        {
          id: '1',
          metier: 'Boulanger',
          nomEtablissement: 'Boulangerie',
          secteurActivite: 'Restauration',
          ville: 'Paris'
        }
      ]
      offresImmersionRepository.findAll
        .withArgs(
          getOffresImmersionQuery.rome,
          getOffresImmersionQuery.lat,
          getOffresImmersionQuery.lon,
          30
        )
        .resolves(offresImmersionQueryModel)

      // When
      const result = await getOffresImmersionQueryHandler.handle(
        getOffresImmersionQuery
      )

      // Then
      expect(result).to.deep.equal(offresImmersionQueryModel)
    })
  })
})
