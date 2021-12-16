import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../../src/application/queries/get-offres-immersion.query.handler'
import { OffreImmersionQueryModel } from '../../../src/application/queries/query-models/offres-immersion.query-models'
import { success } from '../../../src/building-blocks/types/result'
import { OffresImmersion } from '../../../src/domain/offre-immersion'
import { createSandbox, expect } from '../../utils'

describe('GetOffresImmersionQueryHandler', () => {
  let offresImmersionRepository: StubbedType<OffresImmersion.Repository>
  let getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)

    getOffresImmersionQueryHandler = new GetOffresImmersionQueryHandler(
      offresImmersionRepository
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
          getOffresImmersionQuery.lon
        )
        .resolves(success(offresImmersionQueryModel))

      // When
      const result = await getOffresImmersionQueryHandler.handle(
        getOffresImmersionQuery
      )

      // Then
      expect(result).to.deep.equal(success(offresImmersionQueryModel))
    })
  })
})
