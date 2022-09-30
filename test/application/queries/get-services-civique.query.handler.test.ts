import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from '../../../src/application/queries/get-services-civique.query.handler'
import { ServiceCiviqueQueryModel } from '../../../src/application/queries/query-models/service-civique.query-model'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { offresServicesCiviqueQueryModel } from '../../fixtures/query-models/offre-service-civique.query-model.fixtures'
import { FindAllOffresServicesCiviqueQueryGetter } from '../../../src/application/queries/query-getters/find-all-offres-services-civique.query.getter'
import { success } from '../../../src/building-blocks/types/result'

describe('GetServicesCiviqueQueryHandler', () => {
  let findAllOffresServicesCiviqueQueryGetter: StubbedClass<FindAllOffresServicesCiviqueQueryGetter>
  let getServicesCiviqueQueryHandler: GetServicesCiviqueQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    findAllOffresServicesCiviqueQueryGetter = stubClass(
      FindAllOffresServicesCiviqueQueryGetter
    )
    evenementService = stubClass(EvenementService)

    getServicesCiviqueQueryHandler = new GetServicesCiviqueQueryHandler(
      findAllOffresServicesCiviqueQueryGetter,
      evenementService
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne des offres', async () => {
      // Given
      const getServicesCiviqueQuery: GetServicesCiviqueQuery = {
        page: 2,
        limit: 52,
        lat: 48.86899229710103,
        lon: 2.3342718577284205,
        distance: 10,
        dateDeDebutMaximum: '2022-02-17T10:00:00Z',
        dateDeDebutMinimum: '2022-02-17T10:00:00Z',
        domaine: 'environnement'
      }
      const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
        offresServicesCiviqueQueryModel()

      findAllOffresServicesCiviqueQueryGetter.handle
        .withArgs({
          ...getServicesCiviqueQuery,
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          page: 2,
          limit: 52
        })
        .resolves(
          success({
            total: serviceCiviqueQueryModels.length,
            results: serviceCiviqueQueryModels
          })
        )

      // When
      const result = await getServicesCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.deep.equal(success(serviceCiviqueQueryModels))
    })

    it('retourne des offres avec une page et limite par défaut', async () => {
      // Given
      const getServicesCiviqueQuery: GetServicesCiviqueQuery = {
        lat: 48.86899229710103,
        lon: 2.3342718577284205,
        distance: 10,
        dateDeDebutMaximum: '2022-02-17T10:00:00Z',
        dateDeDebutMinimum: '2022-02-17T10:00:00Z'
      }
      const offreEngagementQueryModels: ServiceCiviqueQueryModel[] =
        offresServicesCiviqueQueryModel()

      findAllOffresServicesCiviqueQueryGetter.handle
        .withArgs(getServicesCiviqueQuery)
        .resolves(
          success({
            total: offreEngagementQueryModels.length,
            results: offreEngagementQueryModels
          })
        )

      // When
      const result = await getServicesCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.deep.equal(success(offreEngagementQueryModels))
    })
  })

  describe('monitor', () => {
    it('crée un événement de recherche de service civique', async () => {
      // Given
      const getServicesCiviqueQuery: GetServicesCiviqueQuery = {
        page: 2,
        limit: 52,
        lat: 48.86899229710103,
        lon: 2.3342718577284205,
        distance: 10,
        dateDeDebutMaximum: '2022-02-17T10:00:00Z',
        dateDeDebutMinimum: '2022-02-17T10:00:00Z',
        domaine: 'environnement'
      }
      const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
        offresServicesCiviqueQueryModel()

      findAllOffresServicesCiviqueQueryGetter.handle
        .withArgs({
          ...getServicesCiviqueQuery,
          dateDeDebutMaximum: '2022-02-17T10:00:00Z',
          dateDeDebutMinimum: '2022-02-17T10:00:00Z',
          page: 2,
          limit: 52
        })
        .resolves(
          success({
            total: serviceCiviqueQueryModels.length,
            results: serviceCiviqueQueryModels
          })
        )

      // When
      await getServicesCiviqueQueryHandler.monitor(unUtilisateurJeune())

      // Then
      expect(evenementService.creer).to.have.been.calledWith(
        Evenement.Code.SERVICE_CIVIQUE_RECHERCHE,
        unUtilisateurJeune()
      )
    })
  })
})
