import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { expect } from 'chai'
import { GetDetailOffreImmersionQueryHandler } from '../../../src/application/queries/get-detail-offre-immersion.query.handler'
import {
  RechercheDetailOffreInvalide,
  RechercheDetailOffreNonTrouve
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { ImmersionClient } from '../../../src/infrastructure/clients/immersion-client'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneOffreImmersionDtov2 } from '../../fixtures/offre-immersion.dto.fixture'
import { StubbedClass, stubClass } from '../../utils'

describe('GetDetailOffreImmersionQueryHandler', () => {
  let getDetailOffreImmersionQueryHandler: GetDetailOffreImmersionQueryHandler
  let immersionClient: StubbedClass<ImmersionClient>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    immersionClient = stubClass(ImmersionClient)
    evenementService = stubClass(EvenementService)
    getDetailOffreImmersionQueryHandler =
      new GetDetailOffreImmersionQueryHandler(immersionClient, evenementService)
  })

  describe('handle', () => {
    describe('quand la requête est correcte', () => {
      it("renvoie le détail d'une offre", async () => {
        // Given
        const query = {
          idOffreImmersion: 'siret-appellationCode'
        }

        const response: AxiosResponse = {
          config: undefined,
          headers: undefined,
          request: undefined,
          status: 200,
          statusText: '',
          data: uneOffreImmersionDtov2()
        }

        immersionClient.getDetailOffre.resolves(success(response.data))

        // When
        const detailOffre = await getDetailOffreImmersionQueryHandler.handle({
          idOffreImmersion: query.idOffreImmersion
        })

        // Then
        expect(immersionClient.getDetailOffre).to.have.been.calledWith(
          `siret/appellationCode`
        )
        expect(detailOffre).to.deep.equal(
          success({
            estVolontaire: true,
            id: '123456-D1102',
            localisation: {
              latitude: 42,
              longitude: 2
            },
            metier: 'Boulanger-Traiteur',
            nomEtablissement: 'name',
            secteurActivite: 'naf',
            ville: 'city',
            adresse: 'street post code city',
            codeRome: 'D1102',
            siret: '123456',
            contact: {
              modeDeContact: 'PRESENTIEL'
            }
          })
        )
      })
    })
    describe('quand la requête est mauvaise', () => {
      it('renvoie une erreur quand la recherche est faite avec un mauvais id', async () => {
        // Given
        const query = {
          idOffreImmersion: 'fauxId'
        }

        immersionClient.getDetailOffre.resolves(
          failure(new RechercheDetailOffreInvalide("L'id fauxId n'est pas bon"))
        )

        // When
        const offres = await getDetailOffreImmersionQueryHandler.handle({
          idOffreImmersion: query.idOffreImmersion
        })

        // Then
        expect(offres).to.deep.equal(
          failure(new RechercheDetailOffreInvalide("L'id fauxId n'est pas bon"))
        )
      })
      it('renvoie une erreur quand l"offre recherchée est introuvable', async () => {
        // Given
        const query = {
          idOffreImmersion: 'id'
        }

        immersionClient.getDetailOffre.resolves(
          failure(
            new RechercheDetailOffreNonTrouve("Offre d'immersion id not found")
          )
        )

        // When
        const offres = await getDetailOffreImmersionQueryHandler.handle({
          idOffreImmersion: query.idOffreImmersion
        })

        // Then
        expect(offres).to.deep.equal(
          failure(
            new RechercheDetailOffreNonTrouve("Offre d'immersion id not found")
          )
        )
      })
      it('renvoie une erreur quand une erreur inconnue survient', async () => {
        // Given
        const query = {
          idOffreImmersion: 'id'
        }
        const error = new Error('Erreur inconnue')
        immersionClient.getDetailOffre.rejects(error)

        // When
        const offres = getDetailOffreImmersionQueryHandler.handle({
          idOffreImmersion: query.idOffreImmersion
        })

        // Then
        await expect(offres).to.be.rejectedWith(error)
      })
    })
  })

  describe('monitor', () => {
    it('enregistre l‘évènement pour un conseiller', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      // When
      await getDetailOffreImmersionQueryHandler.monitor(utilisateur)
      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_IMMERSION_AFFICHEE,
        utilisateur
      )
    })
    it('n‘enregistre pas l‘évènement pour un jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      // When
      await getDetailOffreImmersionQueryHandler.monitor(utilisateur)
      // Then
      expect(evenementService.creer).to.not.have.been.called()
    })
  })
})
