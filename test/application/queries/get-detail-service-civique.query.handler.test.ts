import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { OffreEngagement } from '../../../src/domain/offre-engagement'
import { unDetailOffreEngagementQuerymodel } from '../../fixtures/query-models/offre-engagement.query-model.fixtures'
import { DetailOffreEngagementQueryModel } from '../../../src/application/queries/query-models/service-civique.query-models'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  GetDetailServiceCiviqueQuery,
  GetDetailServiceCiviqueQueryHandler
} from '../../../src/application/queries/get-detail-service-civique.query.handler'
import { failure } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

describe('GetDetailServiceCiviqueQuery', () => {
  let engagementRepository: StubbedType<OffreEngagement.Repository>
  let getDetailServiceCiviqueQueryHandler: GetDetailServiceCiviqueQueryHandler
  let evenementService: StubbedClass<EvenementService>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    engagementRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    getDetailServiceCiviqueQueryHandler =
      new GetDetailServiceCiviqueQueryHandler(
        engagementRepository,
        evenementService
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne l"offre quand elle existe', async () => {
      // Given
      const getServicesCiviqueQuery: GetDetailServiceCiviqueQuery = {
        idOffreEngagement: 'ABC123'
      }
      const detailOffreEngagementQueryModel: DetailOffreEngagementQueryModel =
        unDetailOffreEngagementQuerymodel()

      engagementRepository.getOffreEngagementQueryModelById
        .withArgs(getServicesCiviqueQuery.idOffreEngagement)
        .resolves(detailOffreEngagementQueryModel)

      // When
      const result = await getDetailServiceCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.deep.equal(detailOffreEngagementQueryModel)
    })
    it('retourne une failure quand l"offre n"existe pas', async () => {
      // Given
      const getServicesCiviqueQuery: GetDetailServiceCiviqueQuery = {
        idOffreEngagement: 'ABC123'
      }

      engagementRepository.getOffreEngagementQueryModelById
        .withArgs(getServicesCiviqueQuery.idOffreEngagement)
        .resolves(
          failure(
            new NonTrouveError(
              'OffreEngagement',
              getServicesCiviqueQuery.idOffreEngagement
            )
          )
        )

      // When
      const result = await getDetailServiceCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.be.deep.equal(
        failure(
          new NonTrouveError(
            'OffreEngagement',
            getServicesCiviqueQuery.idOffreEngagement
          )
        )
      )
    })
  })

  describe('monitor', () => {
    it('crée un événement de détail d"une offre service civique', async () => {
      // Given
      const getServicesCiviqueQuery: GetDetailServiceCiviqueQuery = {
        idOffreEngagement: 'ABC123'
      }
      const detailOffreEngagementQueryModel: DetailOffreEngagementQueryModel =
        unDetailOffreEngagementQuerymodel()

      engagementRepository.getOffreEngagementQueryModelById
        .withArgs(getServicesCiviqueQuery)
        .resolves(detailOffreEngagementQueryModel)

      // When
      await getDetailServiceCiviqueQueryHandler.monitor(
        unUtilisateurJeune(),
        getServicesCiviqueQuery
      )

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWith(
        Evenement.Type.OFFRE_SERVICE_CIVIQUE_AFFICHE,
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
