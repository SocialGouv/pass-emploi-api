import { GetDetailOffreEmploiQueryHandler } from '../../../src/application/queries/get-detail-offre-emploi.query.handler'
import { expect, StubbedClass, stubClass } from '../../utils'
import { PoleEmploiClient } from '../../../src/infrastructure/clients/pole-emploi-client'
import { uneOffreEmploiDto } from '../../fixtures/offre-emploi.fixture'
import { OffreEmploiQueryModel } from '../../../src/application/queries/query-models/offres-emploi.query-model'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { Evenement, EvenementService } from '../../../src/domain/evenement'

describe('GetDetailOffreEmploiQueryHandler', () => {
  let getDetailOffreEmploiQueryHandler: GetDetailOffreEmploiQueryHandler
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    poleEmploiClient = stubClass(PoleEmploiClient)
    evenementService = stubClass(EvenementService)
    getDetailOffreEmploiQueryHandler = new GetDetailOffreEmploiQueryHandler(
      poleEmploiClient,
      evenementService
    )
  })

  describe('handle', () => {
    describe("quand l'offre existe", () => {
      it('retourne le Query Model', async () => {
        // Given
        poleEmploiClient.getOffreEmploi
          .withArgs('id-offre')
          .resolves(uneOffreEmploiDto())

        // When
        const queryModel = await getDetailOffreEmploiQueryHandler.handle({
          idOffreEmploi: 'id-offre'
        })

        // Then
        const expectedQueryModel: OffreEmploiQueryModel = {
          id: uneOffreEmploiDto().id,
          data: uneOffreEmploiDto(),
          urlRedirectPourPostulation: uneOffreEmploiDto().contact.urlPostulation
        }
        expect(queryModel).to.deep.equal(expectedQueryModel)
      })
    })
    describe("gestion de l'url de postulation", () => {
      it('offre avec une un contact qui a une url de postulation doit renvoyer celle-ci', async () => {
        // Given
        const dto = uneOffreEmploiDto()
        poleEmploiClient.getOffreEmploi.withArgs('id-offre').resolves({
          ...dto,
          contact: {
            ...dto.contact,
            urlPostulation: 'url/postulation'
          }
        })

        // When
        const queryModel = await getDetailOffreEmploiQueryHandler.handle({
          idOffreEmploi: 'id-offre'
        })

        // Then
        expect(queryModel?.urlRedirectPourPostulation).to.equal(
          'url/postulation'
        )
      })
      it('offre avec un partenaire qui a une url doit renvoyer celle ci', async () => {
        // Given
        const dto = uneOffreEmploiDto()
        poleEmploiClient.getOffreEmploi.withArgs('id-offre').resolves({
          ...dto,
          contact: {
            ...dto.contact,
            urlPostulation: ''
          },
          origineOffre: {
            ...dto.origineOffre,
            partenaires: [{ url: 'url/partenaire' }]
          }
        })

        // When
        const queryModel = await getDetailOffreEmploiQueryHandler.handle({
          idOffreEmploi: 'id-offre'
        })

        // Then
        expect(queryModel?.urlRedirectPourPostulation).to.deep.equal(
          'url/partenaire'
        )
      })
      it("offre sans contact ni partenaire doit renvoyer l'url origine de l'offre", async () => {
        // Given
        const dto = uneOffreEmploiDto()
        poleEmploiClient.getOffreEmploi.withArgs('id-offre').resolves({
          ...dto,
          contact: {
            ...dto.contact,
            urlPostulation: ''
          },
          origineOffre: {
            ...dto.origineOffre,
            partenaires: [],
            urlOrigine: 'url/offre'
          }
        })

        // When
        const queryModel = await getDetailOffreEmploiQueryHandler.handle({
          idOffreEmploi: 'id-offre'
        })

        // Then
        expect(queryModel?.urlRedirectPourPostulation).to.equal('url/offre')
      })
    })

    describe("quand l'offre n'existe pas", () => {
      it('retourne undefined', async () => {
        // When
        const queryModel = await getDetailOffreEmploiQueryHandler.handle({
          idOffreEmploi: 'id-offre'
        })

        // Then
        expect(queryModel).to.be.undefined()
      })
    })
  })

  describe('monitor', () => {
    describe('quand ‘est un utilisateur conseiller', () => {
      it('enregistre l‘évènement de consultation du détail d‘une offre emploi', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        poleEmploiClient.getOffreEmploi.resolves(
          uneOffreEmploiDto({ alternance: false })
        )

        // When
        await getDetailOffreEmploiQueryHandler.monitor(utilisateur, {
          idOffreEmploi: 'un-id-offre-emploi'
        })

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.OFFRE_EMPLOI_AFFICHEE,
          utilisateur
        )
      })
      it('enregistre l‘évènement de consultation du détail d‘une offre emploi', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        poleEmploiClient.getOffreEmploi.resolves(
          uneOffreEmploiDto({ alternance: true })
        )
        // When
        await getDetailOffreEmploiQueryHandler.monitor(utilisateur, {
          idOffreEmploi: 'un-id-offre-emploi'
        })

        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.OFFRE_ALTERNANCE_AFFICHEE,
          utilisateur
        )
      })
    })
    describe('quand c‘est un utilisateur jeune', () => {
      it('n‘enregistre pas l‘évènement de consultation du détail de l‘offre', async () => {
        const utilisateur = unUtilisateurJeune()
        poleEmploiClient.getOffreEmploi.resolves()

        // When
        await getDetailOffreEmploiQueryHandler.monitor(utilisateur, {
          idOffreEmploi: 'un-id-offre-emploi'
        })

        // Then
        expect(evenementService.creer).to.not.have.been.called()
      })
    })
  })
})
