import { uneOffreEmploiDto } from '../../../fixtures/offre-emploi.fixture'
import {
  toOffresEmploiQueryModel,
  toOffreEmploiQueryModel
} from '../../../../src/infrastructure/repositories/mappers/offres-emploi.mappers'
import { OffresEmploiDto } from '../../../../src/infrastructure/repositories/offre-emploi-http-sql.repository.db'
import { expect } from '../../../utils'
import { desOffresEmploiQueryModel } from '../../../fixtures/query-models/offre-emploi.query-model.fixtures'

describe('OffresEmploiMappers', () => {
  let offreEmploi = uneOffreEmploiDto()
  const page = 1
  const limit = 50
  beforeEach(async () => {
    offreEmploi = uneOffreEmploiDto()
  })

  describe('toOffresEmploiQueryModel', () => {
    describe('quand il y a au moins une offre', () => {
      it('renvoie les bonnes informations quand le lieu de travail est renseigné dans l"offre', async () => {
        // Given
        const offresEmploiDto: OffresEmploiDto = {
          resultats: [offreEmploi]
        }
        // When
        const result = await toOffresEmploiQueryModel(
          page,
          limit,
          offresEmploiDto
        )

        // Then
        expect(result).to.deep.equal(desOffresEmploiQueryModel())
      })
      it('renvoie les bonnes informations le lieu de travail n"est pas renseigné dans l"offre', async () => {
        // Given
        offreEmploi.lieuTravail = undefined
        const offresEmploiDto: OffresEmploiDto = {
          resultats: [offreEmploi]
        }
        // When
        const result = await toOffresEmploiQueryModel(
          page,
          limit,
          offresEmploiDto
        )
        const expectedOffresEmploiQueryModel = {
          pagination: {
            page,
            limit
          },
          results: [
            {
              id: '123DXPM',
              titre: 'Technicien / Technicienne en froid et climatisation',
              typeContrat: 'MIS',
              alternance: false,
              duree: 'Temps plein',
              nomEntreprise: 'RH TT INTERIM',
              localisation: undefined
            }
          ]
        }
        // Then
        expect(result).to.deep.equal(expectedOffresEmploiQueryModel)
      })
    })
    describe('quand il n"y a aucune offre', () => {
      it('renvoie les bonnes informations', async () => {
        // Given
        offreEmploi.lieuTravail = undefined
        const offresEmploiDto: OffresEmploiDto = {
          resultats: []
        }
        // When
        const result = await toOffresEmploiQueryModel(
          page,
          limit,
          offresEmploiDto
        )
        const expectedOffresEmploiQueryModel = {
          pagination: {
            page,
            limit
          },
          results: []
        }
        // Then
        expect(result).to.deep.equal(expectedOffresEmploiQueryModel)
      })
    })
  })
  describe('toOffreEmploiQueryModel', () => {
    describe("gestion de l'url de postulation", () => {
      it('offre avec une un contact qui a une url de postulation doit renvoyer celle-ci', async () => {
        // Given
        offreEmploi.contact.urlPostulation = 'url/postulation'
        // When
        const result = await toOffreEmploiQueryModel(offreEmploi)

        // Then
        expect(result.urlRedirectPourPostulation).to.deep.equal(
          'url/postulation'
        )
      })
      it('offre avec un partenaire qui a une url doit renvoyer celle ci', async () => {
        // Given
        offreEmploi.contact.urlPostulation = ''
        offreEmploi.origineOffre.partenaires = [{ url: 'url/partenaire' }]

        // When
        const result = await toOffreEmploiQueryModel(offreEmploi)

        // Then
        expect(result.urlRedirectPourPostulation).to.deep.equal(
          'url/partenaire'
        )
      })
      it("offre sans contact ni partenaire doit renvoyer l'url origine de l'offre", async () => {
        // Given
        offreEmploi.contact.urlPostulation = ''
        offreEmploi.origineOffre.partenaires = []
        offreEmploi.origineOffre.urlOrigine = 'url/offre'
        // When
        const result = await toOffreEmploiQueryModel(offreEmploi)

        // Then
        expect(result.urlRedirectPourPostulation).to.deep.equal('url/offre')
      })
    })
  })
})
