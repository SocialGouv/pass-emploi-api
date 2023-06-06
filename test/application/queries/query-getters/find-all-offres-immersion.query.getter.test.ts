import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { URLSearchParams } from 'url'
import { expect } from 'chai'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { RechercheOffreInvalide } from '../../../../src/building-blocks/types/domain-error'
import { TIMEOUT } from 'dns'
import { ImmersionClient } from '../../../../src/infrastructure/clients/immersion-client'
import { FindAllOffresImmersionQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-immersion.query.getter'
import { StubbedClass, stubClass } from '../../../utils'

describe('', () => {
  let immersionClient: StubbedClass<ImmersionClient>
  let findAllOffresImmersionQueryGetter: FindAllOffresImmersionQueryGetter

  beforeEach(() => {
    immersionClient = stubClass(ImmersionClient)
    findAllOffresImmersionQueryGetter = new FindAllOffresImmersionQueryGetter(
      immersionClient
    )
  })

  describe('handle', () => {
    describe('quand la requête est correcte', () => {
      it('renvoie les offres', async () => {
        // Given
        const query = {
          rome: 'D1102',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }

        const response: AxiosResponse = {
          data: [
            {
              id: 'id',
              rome: 'mon-rome',
              siret: 'mon-siret',
              romeLabel: 'romeLabel',
              name: 'name',
              nafLabel: 'nafLabel',
              city: 'city',
              voluntaryToImmersion: true
            }
          ],
          status: 200,
          statusText: 'OK',
          request: '',
          headers: '',
          config: ''
        }

        const params = new URLSearchParams()
        params.append('rome', query.rome)
        params.append('longitude', query.location.lon.toString())
        params.append('latitude', query.location.lat.toString())
        params.append('distance_km', query.distance_km.toString())
        params.append('sortedBy', 'date')
        params.append('voluntaryToImmersion', 'true')

        immersionClient.get.withArgs('v1/immersion-offers').resolves(response)

        // When
        const offres = await findAllOffresImmersionQueryGetter.handle({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        expect(immersionClient.get.getCall(0).args).to.be.deep.equal([
          'v1/immersion-offers',
          params
        ])
        expect(offres).to.deep.equal(
          success([
            {
              id: 'mon-siret-mon-rome',
              metier: 'romeLabel',
              nomEtablissement: 'name',
              secteurActivite: 'nafLabel',
              ville: 'city',
              estVolontaire: true
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
          distance_km: 30
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

        immersionClient.get.rejects({ response: badResponse })

        // When
        const offres = await findAllOffresImmersionQueryGetter.handle({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        expect(offres).to.deep.equal(
          failure(new RechercheOffreInvalide('Le champs Rome est pas bon'))
        )
      })
    })
    describe('quand la requête renvoie une erreur', () => {
      it('renvoie une erreur', async () => {
        // Given
        const query = {
          rome: 'PLOP',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }

        const error: Error = new Error(TIMEOUT)

        immersionClient.get.rejects(error)

        // When
        const call = findAllOffresImmersionQueryGetter.handle({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        await expect(call).to.be.rejectedWith(error)
      })
    })
  })
})
