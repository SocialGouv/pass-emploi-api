import { SuggestionPeHttpRepository } from '../../../../../../src/infrastructure/repositories/offre/recherche/suggestion/suggestion-pe-http.repository.db'
import { PoleEmploiPartenaireClient } from '../../../../../../src/infrastructure/clients/pole-emploi-partenaire-client'
import { expect, StubbedClass, stubClass } from '../../../../../utils'
import { success } from '../../../../../../src/building-blocks/types/result'
import {
  uneSuggestionDtoCommuneAvecUnRayonInconnu,
  uneSuggestionDtoCommuneSansRayon,
  uneSuggestionDtoUneCommuneAvecRayon,
  uneSuggestionDtoUnDepartement,
  uneSuggestionDtoUneRegion
} from '../../../../../fixtures/pole-emploi.dto.fixture'
import { Suggestion } from '../../../../../../src/domain/offre/recherche/suggestion/suggestion'
import { CommuneSqlModel } from '../../../../../../src/infrastructure/sequelize/models/commune.sql-model'
import { DatabaseForTesting } from '../../../../../utils/database-for-testing'
import { uneCommuneDto } from '../../../../../fixtures/sql-models/commune.sql-model'

describe('SuggestionPeHttpRepository', () => {
  let suggestionPeHttpRepository: SuggestionPeHttpRepository
  let client: StubbedClass<PoleEmploiPartenaireClient>

  beforeEach(() => {
    DatabaseForTesting.prepare()
    client = stubClass(PoleEmploiPartenaireClient)
    suggestionPeHttpRepository = new SuggestionPeHttpRepository(client)
  })

  describe('findAll', () => {
    beforeEach(async () => {
      await CommuneSqlModel.create(
        uneCommuneDto({
          id: '1',
          libelle: 'FACHES THUMESNIL',
          code: '59220',
          longitude: '-1.677',
          latitude: '48.11'
        })
      )
    })
    describe('une suggestion sur une commune sans rayon', () => {
      it('retourne une suggestion', async () => {
        // Given
        client.getSuggestionsRecherches.resolves(
          success([uneSuggestionDtoCommuneSansRayon()])
        )

        // When
        const suggestions = await suggestionPeHttpRepository.findAll('token')

        // Then
        const expected: Suggestion.PoleEmploi[] = [
          {
            titreMetier: 'Cariste',
            categorieMetier: "Conduite d'engins de déplacement des charges",
            codeRome: 'N1101',
            texteRecherche: 'Cariste',
            localisation: {
              libelle: 'FACHES THUMESNIL',
              code: '59220',
              type: 'COMMUNE',
              rayon: undefined,
              lon: -1.677,
              lat: 48.11
            }
          }
        ]
        expect(suggestions).to.deep.equal(success(expected))
      })
    })
    describe('une suggestion sur une commune avec rayon', () => {
      it('retourne une suggestion par commune', async () => {
        // Given
        client.getSuggestionsRecherches.resolves(
          success([uneSuggestionDtoUneCommuneAvecRayon()])
        )
        await CommuneSqlModel.create(
          uneCommuneDto({
            libelle: 'NANTES',
            code: '44300',
            longitude: '-1.677',
            latitude: '48.11'
          })
        )

        // When
        const suggestions = await suggestionPeHttpRepository.findAll('token')

        // Then
        const expected: Suggestion.PoleEmploi[] = [
          {
            titreMetier: 'Cariste',
            categorieMetier: "Conduite d'engins de déplacement des charges",
            codeRome: 'N1101',
            texteRecherche: 'Cariste',
            localisation: {
              libelle: 'NANTES',
              code: '44300',
              type: 'COMMUNE',
              rayon: 10,
              lon: -1.677,
              lat: 48.11
            }
          }
        ]
        expect(suggestions).to.deep.equal(success(expected))
      })
    })
    describe('une suggestion sur un departement', () => {
      it('retourne une suggestion pour le département', async () => {
        // Given
        client.getSuggestionsRecherches.resolves(
          success([uneSuggestionDtoUnDepartement()])
        )

        // When
        const suggestions = await suggestionPeHttpRepository.findAll('token')

        // Then
        const expected: Suggestion.PoleEmploi[] = [
          {
            titreMetier: 'Cariste',
            categorieMetier: "Conduite d'engins de déplacement des charges",
            codeRome: 'N1101',
            texteRecherche: 'Cariste',
            localisation: {
              libelle: 'Nord',
              code: '59',
              type: 'DEPARTEMENT',
              rayon: undefined
            }
          }
        ]
        expect(suggestions).to.deep.equal(success(expected))
      })
    })
    describe('une suggestion sur une region', () => {
      it('ne renvoie rien', async () => {
        // Given
        client.getSuggestionsRecherches.resolves(
          success([uneSuggestionDtoUneRegion()])
        )

        // When
        const suggestions = await suggestionPeHttpRepository.findAll('token')

        // Then
        expect(suggestions).to.deep.equal(success([]))
      })
    })
    describe("le rayon n'est pas en kilometres", () => {
      it('ne met pas le rayon', async () => {
        // Given
        client.getSuggestionsRecherches.resolves(
          success([uneSuggestionDtoCommuneAvecUnRayonInconnu()])
        )

        // When
        const suggestions = await suggestionPeHttpRepository.findAll('token')

        // Then
        const expected: Suggestion.PoleEmploi[] = [
          {
            titreMetier: 'Cariste',
            categorieMetier: "Conduite d'engins de déplacement des charges",
            codeRome: 'N1101',
            texteRecherche: 'Cariste',
            localisation: {
              libelle: 'FACHES THUMESNIL',
              code: '59220',
              type: 'COMMUNE',
              rayon: undefined,
              lon: -1.677,
              lat: 48.11
            }
          }
        ]
        expect(suggestions).to.deep.equal(success(expected))
      })
    })
  })
})
