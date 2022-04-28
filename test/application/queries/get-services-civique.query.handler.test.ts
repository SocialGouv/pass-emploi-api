import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from '../../../src/application/queries/get-services-civique.query.handler'
import { OffreServiceCivique } from '../../../src/domain/offre-service-civique'
import { DateTime } from 'luxon'
import { ServiceCiviqueQueryModel } from '../../../src/application/queries/query-models/service-civique.query-models'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { offresServicesCiviqueQueryModel } from '../../fixtures/query-models/offre-service-civique.query-model.fixtures'

describe('GetServicesCiviqueQueryHandler', () => {
  let offresServiceCiviqueRepository: StubbedType<OffreServiceCivique.Repository>
  let getServicesCiviqueQueryHandler: GetServicesCiviqueQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    offresServiceCiviqueRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    getServicesCiviqueQueryHandler = new GetServicesCiviqueQueryHandler(
      offresServiceCiviqueRepository,
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

      offresServiceCiviqueRepository.findAll
        .withArgs({
          ...getServicesCiviqueQuery,
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
        })
        .resolves(serviceCiviqueQueryModels)

      // When
      const result = await getServicesCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.deep.equal(serviceCiviqueQueryModels)
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

      offresServiceCiviqueRepository.findAll
        .withArgs({
          ...getServicesCiviqueQuery,
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE,
          page: 1,
          limit: 50
        })
        .resolves(offreEngagementQueryModels)

      // When
      const result = await getServicesCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.deep.equal(offreEngagementQueryModels)
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

      offresServiceCiviqueRepository.findAll
        .withArgs({
          ...getServicesCiviqueQuery,
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          editeur: OffreServiceCivique.Editeur.SERVICE_CIVIQUE
        })
        .resolves(serviceCiviqueQueryModels)

      // When
      await getServicesCiviqueQueryHandler.monitor(
        unUtilisateurJeune(),
        getServicesCiviqueQuery
      )

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWith(
        Evenement.Type.SERVICE_CIVIQUE_RECHERCHE,
        unUtilisateurJeune()
      )
    })
  })
})
