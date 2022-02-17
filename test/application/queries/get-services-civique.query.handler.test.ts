import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from '../../../src/application/queries/get-services-civique.query.handler'
import { ServiceCivique } from '../../../src/domain/service-civique'
import { DateTime } from 'luxon'
import { serviceCiviqueQueryModel } from '../../fixtures/query-models/service-civique.query-model.fixtures'
import { ServiceCiviqueQueryModel } from '../../../src/application/queries/query-models/service-civique.query-models'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'

describe('GetServicesCiviqueQueryHandler', () => {
  let serviceCiviqueRepository: StubbedType<ServiceCivique.Repository>
  let getServicesCiviqueQueryHandler: GetServicesCiviqueQueryHandler
  let sandbox: SinonSandbox
  let evenementService: StubbedClass<EvenementService>

  before(() => {
    sandbox = createSandbox()
    serviceCiviqueRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    getServicesCiviqueQueryHandler = new GetServicesCiviqueQueryHandler(
      serviceCiviqueRepository,
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
        dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
        dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
        domaine: 'environnement'
      }
      const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
        serviceCiviqueQueryModel()

      serviceCiviqueRepository.findAll
        .withArgs(getServicesCiviqueQuery)
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
        dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
        dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z')
      }
      const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
        serviceCiviqueQueryModel()

      serviceCiviqueRepository.findAll
        .withArgs({
          ...getServicesCiviqueQuery,
          page: 1,
          limit: 50
        })
        .resolves(serviceCiviqueQueryModels)

      // When
      const result = await getServicesCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.deep.equal(serviceCiviqueQueryModels)
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
        dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
        dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
        domaine: 'environnement'
      }
      const serviceCiviqueQueryModels: ServiceCiviqueQueryModel[] =
        serviceCiviqueQueryModel()

      serviceCiviqueRepository.findAll
        .withArgs(getServicesCiviqueQuery)
        .resolves(serviceCiviqueQueryModels)

      // When
      await getServicesCiviqueQueryHandler.monitor(
        unUtilisateurJeune(),
        getServicesCiviqueQuery
      )

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWith(
        Evenement.Type.SERVICE_CIVIQUE_RECHERCHE,
        {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John',
          type: 'JEUNE',
          email: 'john.doe@plop.io',
          structure: 'MILO',
          roles: []
        }
      )
    })
  })
})
