import { SinonSandbox } from 'sinon'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { GetDetailServiceCiviqueQueryHandler } from '../../../src/application/queries/get-detail-service-civique.query.handler'
import { failure, success } from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import { Offre } from '../../../src/domain/offre/offre'
import { uneOffreServiceCiviqueDto } from '../../fixtures/offre-service-civique.fixture'

describe('GetDetailServiceCiviqueQuery', () => {
  let serviceCiviqueClient: StubbedClass<EngagementClient>
  let getDetailServiceCiviqueQueryHandler: GetDetailServiceCiviqueQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    serviceCiviqueClient = stubClass(EngagementClient)

    getDetailServiceCiviqueQueryHandler =
      new GetDetailServiceCiviqueQueryHandler(serviceCiviqueClient)
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
      const offreEngagement: Offre.Favori.ServiceCivique = {
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
        descriptionOrganisation: 'description',
        id: 'unId',
        localisation: {
          longitude: 1.2,
          latitude: 3.4
        }
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
})
