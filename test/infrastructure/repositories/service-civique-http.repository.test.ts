import {
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ServiceCivique } from '../../../src/domain/service-civique'
import { ServiceCiviqueHttpRepository } from '../../../src/infrastructure/repositories/service-civique-http.repository'
import { ServiceCiviqueClient } from '../../../src/infrastructure/clients/service-civique-client'
import { DateTime } from 'luxon'
import { success } from '../../../src/building-blocks/types/result'

describe('ServiceCiviqueHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let serviceCiviqueHttpSqlRepository: ServiceCiviqueHttpRepository
  let serviceCiviqueClient: StubbedClass<ServiceCiviqueClient>

  beforeEach(async () => {
    serviceCiviqueClient = stubClass(ServiceCiviqueClient)

    serviceCiviqueHttpSqlRepository = new ServiceCiviqueHttpRepository(
      serviceCiviqueClient
    )
  })

  describe('.findAll', () => {
    describe('Quand tout va bien', () => {
      it('quand tous les query params sont fournis', async () => {
        // Given
        const criteres: ServiceCivique.Criteres = {
          page: 1,
          limit: 50,
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement'
        }
        const params = new URLSearchParams()
        params.append('size', '50')
        params.append('from', '1')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10km')
        params.append('domain', 'environnement')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
            hits: [
              {
                id: 'unId',
                title: 'unTitre',
                startAt: '2022-02-17T10:00:00.000Z',
                domain: 'Informatique',
                city: 'paris'
              }
            ]
          }
        })

        // When
        const result = await serviceCiviqueHttpSqlRepository.findAll(criteres)

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/search',
          params
        )
        expect(result).to.be.deep.equal(
          success([
            {
              dateDeDebut: '2022-02-17T10:00:00.000Z',
              domaine: 'Informatique',
              id: 'unId',
              titre: 'unTitre',
              ville: 'paris'
            }
          ])
        )
      })
      it('avec la deuxième page', async () => {
        // Given
        const criteres: ServiceCivique.Criteres = {
          page: 2,
          limit: 63,
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10
        }
        const params = new URLSearchParams()
        params.append('size', '63')
        params.append('from', '64')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
            hits: [
              {
                id: 'unId',
                title: 'unTitre',
                startAt: '2022-02-17T10:00:00.000Z',
                domain: 'Informatique',
                city: 'paris'
              }
            ]
          }
        })

        // When
        const result = await serviceCiviqueHttpSqlRepository.findAll(criteres)

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/search',
          params
        )
        expect(result).to.be.deep.equal(
          success([
            {
              dateDeDebut: '2022-02-17T10:00:00.000Z',
              domaine: 'Informatique',
              id: 'unId',
              titre: 'unTitre',
              ville: 'paris'
            }
          ])
        )
      })
    })
  })
})
