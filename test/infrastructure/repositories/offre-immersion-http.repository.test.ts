import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { expect } from 'chai'
import { RechercheOffreInvalide } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { ImmersionClient } from '../../../src/infrastructure/clients/immersion-client'
import { OffresImmersionHttpRepository } from '../../../src/infrastructure/repositories/offre-immersion-http.repository'
import { StubbedClass, stubClass } from '../../utils'

describe('OffresImmersionHttpRepository', () => {
  let offresImmersionHttpRepository: OffresImmersionHttpRepository
  let immersionClient: StubbedClass<ImmersionClient>

  beforeEach(() => {
    immersionClient = stubClass(ImmersionClient)

    offresImmersionHttpRepository = new OffresImmersionHttpRepository(
      immersionClient
    )
  })
  describe('findAll', () => {
    describe('quand la requête est correcte', () => {
      it('renvoie les offres', async () => {
        // Given
        const query = {
          rome: 'D1102',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 10
        }

        const response: AxiosResponse = {
          data: [
            {
              id: 'id',
              romeLabel: 'romeLabel',
              name: 'name',
              nafLabel: 'nafLabel',
              city: 'city'
            }
          ],
          status: 200,
          statusText: 'OK',
          request: '',
          headers: '',
          config: ''
        }

        immersionClient.post
          .withArgs('search-immersion', query)
          .resolves(response)

        // When
        const offres = await offresImmersionHttpRepository.findAll(
          query.rome,
          query.location.lat,
          query.location.lon
        )

        // Then
        expect(offres).to.deep.equal(
          success([
            {
              id: 'id',
              metier: 'romeLabel',
              nomEtablissement: 'name',
              secteurActivite: 'nafLabel',
              ville: 'city'
            }
          ])
        )
      })
    })

    describe('quand la requête est mauvaise', () => {
      it('renvoie une erreur', async () => {
        // Given
        const query = {
          rome: 'PLOP',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 10
        }

        const badResponse: AxiosResponse = {
          data: {
            errors: [
              {
                message: 'Le champs Rome est pas bon'
              }
            ]
          },
          status: 400,
          statusText: 'BAD_REQUEST',
          request: '',
          headers: '',
          config: ''
        }

        immersionClient.post.rejects({ response: badResponse })

        // When
        const offres = await offresImmersionHttpRepository.findAll(
          query.rome,
          query.location.lat,
          query.location.lon
        )

        // Then
        expect(offres).to.deep.equal(
          failure(new RechercheOffreInvalide('Le champs Rome est pas bon'))
        )
      })
    })
  })
})
