import { OffreServiceCivique } from '../../../../src/domain/offre-service-civique'
import { DateTime } from 'luxon'
import {
  uneOffreServiceCivique,
  uneOffreServiceCiviqueDto
} from '../../../fixtures/offre-service-civique.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../../src/building-blocks/types/domain-error'
import { EngagementClient } from '../../../../src/infrastructure/clients/engagement-client'
import { FindAllOffresServicesCiviqueQueryGetter } from '../../../../src/application/queries/query-getters/find-all-offres-services-civique.query.getter'

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
        const criteres: OffreServiceCivique.Criteres = {
          page: 1,
          limit: 50,
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement',
          editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
        }
        const params = new URLSearchParams()
        params.append('size', '50')
        params.append('from', '0')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10km')
        params.append('domain', 'environnement')
        params.append('publisher', OffreServiceCivique.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
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
        expect(result).to.be.deep.equal(success([uneOffreServiceCivique()]))
      })
      it('avec la deuxième page', async () => {
        // Given
        const criteres: OffreServiceCivique.Criteres = {
          page: 2,
          limit: 63,
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          dateDeCreationMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
        }
        const params = new URLSearchParams()
        params.append('size', '63')
        params.append('from', '63')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10')
        params.append('publisher', OffreServiceCivique.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')
        params.append('createdAt', 'gt:2022-02-17T10:00:00Z')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
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
        expect(result).to.be.deep.equal(success([uneOffreServiceCivique()]))
      })
    })
    describe('Quand il y a une erreur', () => {
      it('renvoie une failure http', async () => {
        // Given
        const criteres: OffreServiceCivique.Criteres = {
          page: 1,
          limit: 50,
          editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
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
