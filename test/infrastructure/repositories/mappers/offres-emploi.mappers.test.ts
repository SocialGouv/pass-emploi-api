import { OffresEmploiQueryModel } from '../../../../src/application/queries/query-models/offres-emploi.query-model'
import { uneOffreEmploiDto } from '../../../fixtures/offre-emploi.fixture'
import { toOffresEmploiQueryModel } from '../../../../src/infrastructure/repositories/mappers/offres-emploi.mappers'
import { expect } from '../../../utils'
import { desOffresEmploiQueryModel } from '../../../fixtures/query-models/offre-emploi.query-model.fixtures'
import { OffreEmploiDto } from '../../../../src/infrastructure/repositories/dto/pole-emploi.dto'

describe('OffresEmploiMappers', () => {
  let offreEmploi = uneOffreEmploiDto()
  const page = 1
  const limit = 50
  const total = 1
  beforeEach(async () => {
    offreEmploi = uneOffreEmploiDto()
  })

  describe('toOffresEmploiQueryModel', () => {
    describe('quand il y a au moins une offre', () => {
      it('renvoie les bonnes informations quand le lieu de travail est renseigné dans l"offre', async () => {
        // Given
        const offresEmploiDto = [offreEmploi]
        // When
        const result = toOffresEmploiQueryModel(
          page,
          limit,
          total,
          offresEmploiDto
        )

        // Then
        expect(result).to.deep.equal(desOffresEmploiQueryModel())
      })
      it('renvoie les bonnes informations le lieu de travail n"est pas renseigné dans l"offre', async () => {
        // Given
        offreEmploi.lieuTravail = undefined
        const offresEmploiDto = [offreEmploi]
        // When
        const result = toOffresEmploiQueryModel(
          page,
          limit,
          total,
          offresEmploiDto
        )
        const expectedOffresEmploiQueryModel: OffresEmploiQueryModel = {
          pagination: {
            page,
            limit,
            total
          },
          results: [
            {
              id: '123DXPM',
              titre: 'Technicien / Technicienne en froid et climatisation',
              typeContrat: 'MIS',
              alternance: false,
              duree: 'Temps plein',
              nomEntreprise: 'RH TT INTERIM',
              localisation: undefined,
              origine: {
                nom: 'France Travail'
              }
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
        const offresEmploiDto: OffreEmploiDto[] = []
        // When
        const result = toOffresEmploiQueryModel(
          page,
          limit,
          total,
          offresEmploiDto
        )
        const expectedOffresEmploiQueryModel: OffresEmploiQueryModel = {
          pagination: {
            page,
            limit,
            total
          },
          results: []
        }
        // Then
        expect(result).to.deep.equal(expectedOffresEmploiQueryModel)
      })
    })
  })
})
