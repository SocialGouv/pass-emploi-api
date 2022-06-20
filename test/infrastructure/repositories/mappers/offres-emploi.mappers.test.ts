import { uneOffreEmploiDto } from '../../../fixtures/offre-emploi.fixture'
import { toOffresEmploiQueryModel } from '../../../../src/infrastructure/repositories/mappers/offres-emploi.mappers'
import { expect } from '../../../utils'
import { desOffresEmploiQueryModel } from '../../../fixtures/query-models/offre-emploi.query-model.fixtures'
import { OffresEmploiDto } from '../../../../src/infrastructure/repositories/dto/pole-emploi.dto'

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
})
