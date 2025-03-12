import { SinonSandbox } from 'sinon'
import { DetailServiceCiviqueQueryModel } from 'src/application/queries/query-models/service-civique.query-model'
import { GetDetailOffreServiceCiviqueQueryHandler } from '../../../src/application/queries/get-detail-offre-service-civique.query.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneOffreServiceCiviqueDto } from '../../fixtures/offre-service-civique.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('GetDetailServiceCiviqueQuery', () => {
  let getDetailServiceCiviqueQueryHandler: GetDetailOffreServiceCiviqueQueryHandler
  let serviceCiviqueClient: StubbedClass<EngagementClient>
  let evenementService: StubbedClass<EvenementService>
  let sandbox: SinonSandbox

  beforeEach(() => {
    sandbox = createSandbox()
    serviceCiviqueClient = stubClass(EngagementClient)
    evenementService = stubClass(EvenementService)

    getDetailServiceCiviqueQueryHandler =
      new GetDetailOffreServiceCiviqueQueryHandler(
        serviceCiviqueClient,
        evenementService
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('quand l"offre existe', async () => {
      // Given
      const idOffreEngagement = 'unId'
      serviceCiviqueClient.get.resolves({
        status: 200,
        statusText: 'OK',
        headers: '',
        config: '',
        data: {
          ok: true,
          data: uneOffreServiceCiviqueDto()
        }
      })

      // When
      const result = await getDetailServiceCiviqueQueryHandler.handle({
        idOffre: idOffreEngagement
      })

      // Then
      expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
        'v0/mission/unId'
      )
      const offreEngagement: DetailServiceCiviqueQueryModel = {
        titre: 'unTitre',
        dateDeDebut: '2022-02-17T10:00:00.000Z',
        dateDeFin: '2022-07-17T10:00:00.000Z',
        domaine: 'Informatique',
        ville: 'paris',
        organisation: 'orga de ouf',
        lienAnnonce: 'lienoffre.com',
        urlOrganisation: 'lienorganisation.com',
        adresseMission: 'adresse mission',
        adresseOrganisation: 'adresse organistation',
        codeDepartement: '75',
        description: 'offre très intéressante',
        codePostal: '75018',
        descriptionOrganisation: 'description'
      }
      expect(result).to.be.deep.equal(success(offreEngagement))
    })

    it('quand l"offre n"existe pas', async () => {
      // Given
      const idOffreEngagement = 'unFauxId'
      serviceCiviqueClient.get.rejects({
        response: {
          status: 404,
          data: {
            message: 'Not Found'
          }
        }
      })

      // When
      const result = await getDetailServiceCiviqueQueryHandler.handle({
        idOffre: idOffreEngagement
      })

      // Then
      expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
        'v0/mission/unFauxId'
      )
      expect(result).to.be.deep.equal(
        failure(new NonTrouveError('OffreEngagement', 'unFauxId'))
      )
    })
  })

  describe('monitor', () => {
    it('enregistre l‘évènement pour un conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      // When
      await getDetailServiceCiviqueQueryHandler.monitor(utilisateur)
      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_SERVICE_CIVIQUE_AFFICHE,
        utilisateur
      )
    })
    it('n‘enregistre pas l‘évènement pour un jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      // When
      await getDetailServiceCiviqueQueryHandler.monitor(utilisateur)
      // Then
      expect(evenementService.creer).to.not.have.been.called()
    })
  })
})
