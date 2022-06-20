import { GetDetailOffreEmploiQueryHandler } from '../../../src/application/queries/get-detail-offre-emploi.query.handler'
import { expect, StubbedClass, stubClass } from '../../utils'
import { PoleEmploiClient } from '../../../src/infrastructure/clients/pole-emploi-client'
import { uneOffreEmploiDto } from '../../fixtures/offre-emploi.fixture'
import { OffreEmploiQueryModel } from '../../../src/application/queries/query-models/offres-emploi.query-model'

describe('GetDetailOffreEmploiQueryHandler', () => {
  let getDetailOffreEmploiQueryHandler: GetDetailOffreEmploiQueryHandler
  let poleEmploiClient: StubbedClass<PoleEmploiClient>

  beforeEach(() => {
    poleEmploiClient = stubClass(PoleEmploiClient)
    getDetailOffreEmploiQueryHandler = new GetDetailOffreEmploiQueryHandler(
      poleEmploiClient
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
})
