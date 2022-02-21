import {
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { OffreEngagement } from '../../../src/domain/offre-engagement'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import { DateTime } from 'luxon'
import { failure, success } from '../../../src/building-blocks/types/result'
import { EngagementHttpRepository } from '../../../src/infrastructure/repositories/offre-engagement-http.repository'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'

describe('OffreEngagementRepository', () => {
  DatabaseForTesting.prepare()
  let engagementHttpRepository: EngagementHttpRepository
  let serviceCiviqueClient: StubbedClass<EngagementClient>

  beforeEach(async () => {
    serviceCiviqueClient = stubClass(EngagementClient)

    engagementHttpRepository = new EngagementHttpRepository(
      serviceCiviqueClient
    )
  })

  describe('.findAll', () => {
    describe('Quand tout va bien', () => {
      it('quand tous les query params sont fournis', async () => {
        // Given
        const criteres: OffreEngagement.Criteres = {
          page: 1,
          limit: 50,
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement',
          editeur: OffreEngagement.Editeur.SERVICE_CIVIQUE
        }
        const params = new URLSearchParams()
        params.append('size', '50')
        params.append('from', '0')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10km')
        params.append('domain', 'environnement')
        params.append('publisher', OffreEngagement.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')

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
                city: 'paris',
                organizationName: 'orga de ouf'
              }
            ]
          }
        })

        // When
        const result = await engagementHttpRepository.findAll(criteres)

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
              ville: 'paris',
              organisation: 'orga de ouf'
            }
          ])
        )
      })
      it('avec la deuxième page', async () => {
        // Given
        const criteres: OffreEngagement.Criteres = {
          page: 2,
          limit: 63,
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          editeur: OffreEngagement.Editeur.SERVICE_CIVIQUE
        }
        const params = new URLSearchParams()
        params.append('size', '63')
        params.append('from', '63')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10')
        params.append('publisher', OffreEngagement.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')

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
                city: 'paris',
                organizationName: 'orga de ouf'
              }
            ]
          }
        })

        // When
        const result = await engagementHttpRepository.findAll(criteres)

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
              ville: 'paris',
              organisation: 'orga de ouf'
            }
          ])
        )
      })
    })
    describe('Quand il y a une erreur', () => {
      it('renvoie une failure http', async () => {
        // Given
        const criteres: OffreEngagement.Criteres = {
          page: 1,
          limit: 50,
          editeur: OffreEngagement.Editeur.SERVICE_CIVIQUE
        }

        serviceCiviqueClient.get.rejects({
          response: {
            status: 400,
            data: {
              message: 'Bad request'
            }
          }
        })

        // When
        const result = await engagementHttpRepository.findAll(criteres)

        // Then
        expect(result).to.be.deep.equal(
          failure(new ErreurHttp('Bad request', 400))
        )
      })
    })
  })
})
