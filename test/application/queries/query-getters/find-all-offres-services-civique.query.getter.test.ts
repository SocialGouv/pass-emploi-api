import { GetServicesCiviqueQuery } from '../../../../src/application/queries/get-offres-services-civique.query.handler'
import { FindAllOffresServicesCiviqueQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-services-civique.query.getter'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { Offre } from '../../../../src/domain/offre/offre'
import { EngagementClient } from '../../../../src/infrastructure/clients/engagement-client'
import { uneOffreServiceCiviqueDto } from '../../../fixtures/offre-service-civique.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'

describe('FindAllOffresServicesCiviqueQueryGetter', () => {
  let serviceCiviqueClient: StubbedClass<EngagementClient>
  let findAllOffresServicesCiviqueQueryGetter: FindAllOffresServicesCiviqueQueryGetter

  beforeEach(() => {
    serviceCiviqueClient = stubClass(EngagementClient)
    findAllOffresServicesCiviqueQueryGetter =
      new FindAllOffresServicesCiviqueQueryGetter(serviceCiviqueClient)
  })

  describe('.handle', () => {
    describe('Quand tout va bien', () => {
      it('quand tous les query params sont fournis', async () => {
        // Given
        const criteres: GetServicesCiviqueQuery = {
          page: 1,
          limit: 50,
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement'
        }
        const params = new URLSearchParams()
        params.append('size', '50')
        params.append('from', '0')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10km')
        params.append('domain', 'environnement')
        params.append('publisher', Offre.ServiceCivique.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
            total: 1,
            hits: [uneOffreServiceCiviqueDto()]
          }
        })

        // When
        const result = await findAllOffresServicesCiviqueQueryGetter.handle(
          criteres
        )

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/search',
          params
        )
        expect(result).to.be.deep.equal(
          success({
            total: 1,
            results: [
              {
                dateDeDebut: '2022-02-17T10:00:00.000Z',
                domaine: 'Informatique',
                id: 'unId',
                localisation: {
                  latitude: 3.4,
                  longitude: 1.2
                },
                organisation: 'orga de ouf',
                titre: 'unTitre',
                ville: 'paris'
              }
            ]
          })
        )
      })
      it('avec la deuxième page', async () => {
        // Given
        const criteres: GetServicesCiviqueQuery = {
          page: 2,
          limit: 63,
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          dateDeCreationMinimum: '2022-02-17T10:00:00Z'
        }
        const params = new URLSearchParams()
        params.append('size', '63')
        params.append('from', '63')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10km')
        params.append('publisher', Offre.ServiceCivique.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')
        params.append('createdAt', 'gt:2022-02-17T10:00:00Z')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
            total: 1,
            hits: [uneOffreServiceCiviqueDto()]
          }
        })

        // When
        const result = await findAllOffresServicesCiviqueQueryGetter.handle(
          criteres
        )

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/search',
          params
        )
        expect(result).to.be.deep.equal(
          success({
            total: 1,
            results: [
              {
                dateDeDebut: '2022-02-17T10:00:00.000Z',
                domaine: 'Informatique',
                id: 'unId',
                localisation: {
                  latitude: 3.4,
                  longitude: 1.2
                },
                organisation: 'orga de ouf',
                titre: 'unTitre',
                ville: 'paris'
              }
            ]
          })
        )
      })
    })
    describe('Quand il y a une erreur', () => {
      it('renvoie une failure http', async () => {
        // Given
        const criteres: GetServicesCiviqueQuery = {
          page: 1,
          limit: 50
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
        const result = await findAllOffresServicesCiviqueQueryGetter.handle(
          criteres
        )

        // Then
        expect(result).to.be.deep.equal(
          failure(new ErreurHttp('Bad request', 400))
        )
      })
    })
  })
})
