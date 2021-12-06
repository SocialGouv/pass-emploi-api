import { uneOffreEmploiDto } from '../../../fixtures/offre-emploi.fixture'
import { toOffresEmploiQueryModel } from '../../../../src/infrastructure/repositories/mappers/offres-emploi.mappers'
import { OffresEmploiDto } from '../../../../src/infrastructure/repositories/offre-emploi-http-sql.repository'
import { expect } from '../../../utils'

describe('OffresEmploiMappers', () => {
  const offreEmploi = uneOffreEmploiDto()
  const page = 1
  const limit = 50

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
              localisation: {
                nom: 'libelle',
                codePostal: '57000',
                commune: '57463'
              }
            }
          ]
        }
        // Then
        expect(result).to.deep.equal(expectedOffresEmploiQueryModel)
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
