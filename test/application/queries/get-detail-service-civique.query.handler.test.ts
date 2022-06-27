import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { OffreServiceCivique } from '../../../src/domain/offre-service-civique'
import { DetailServiceCiviqueQueryModel } from '../../../src/application/queries/query-models/service-civique.query-model'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  GetDetailOffreServiceCiviqueQuery,
  GetDetailServiceCiviqueQueryHandler
} from '../../../src/application/queries/get-detail-service-civique.query.handler'
import { failure } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { unDetailOffreServiceCiviqueQuerymodel } from '../../fixtures/query-models/offre-service-civique.query-model.fixtures'

describe('GetDetailServiceCiviqueQuery', () => {
  let engagementRepository: StubbedType<OffreServiceCivique.Repository>
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
      const getServicesCiviqueQuery: GetDetailOffreServiceCiviqueQuery = {
        idOffre: 'ABC123'
      }
      const detailServiceCiviqueQueryModel: DetailServiceCiviqueQueryModel =
        unDetailOffreServiceCiviqueQuerymodel()

      engagementRepository.getServiceCiviqueById
        .withArgs(getServicesCiviqueQuery.idOffre)
        .resolves(detailServiceCiviqueQueryModel)

      // When
      const result = await getDetailServiceCiviqueQueryHandler.handle(
        getServicesCiviqueQuery
      )

      // Then
      expect(result).to.deep.equal(detailServiceCiviqueQueryModel)
    })
    it('retourne une failure quand l"offre n"existe pas', async () => {
      // Given
      const getServicesCiviqueQuery: GetDetailOffreServiceCiviqueQuery = {
        idOffre: 'ABC123'
      }

      engagementRepository.getServiceCiviqueById
        .withArgs(getServicesCiviqueQuery.idOffre)
        .resolves(
          failure(
            new NonTrouveError(
              'OffreEngagement',
              getServicesCiviqueQuery.idOffre
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
          new NonTrouveError('OffreEngagement', getServicesCiviqueQuery.idOffre)
        )
      )
    })
  })

  describe('monitor', () => {
    it('crée un événement de détail d"une offre service civique', async () => {
      // Given
      const getServicesCiviqueQuery: GetDetailOffreServiceCiviqueQuery = {
        idOffre: 'ABC123'
      }
      const detailOffreEngagementQueryModel: DetailServiceCiviqueQueryModel =
        unDetailOffreServiceCiviqueQuerymodel()

      engagementRepository.getServiceCiviqueById
        .withArgs(getServicesCiviqueQuery)
        .resolves(detailOffreEngagementQueryModel)

      // When
      await getDetailServiceCiviqueQueryHandler.monitor(unUtilisateurJeune())

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWith(
        Evenement.Type.OFFRE_SERVICE_CIVIQUE_AFFICHE,
        unUtilisateurJeune()
      )
    })
  })
})
