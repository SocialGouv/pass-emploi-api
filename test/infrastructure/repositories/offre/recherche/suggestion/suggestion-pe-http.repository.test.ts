import { SuggestionPeHttpRepository } from '../../../../../../src/infrastructure/repositories/offre/recherche/suggestion/suggestion-pe-http.repository'
import { PoleEmploiPartenaireClient } from '../../../../../../src/infrastructure/clients/pole-emploi-partenaire-client'
import { expect, StubbedClass, stubClass } from '../../../../../utils'
import { success } from '../../../../../../src/building-blocks/types/result'
import {
  uneSuggestionDtoCommuneAvecUnRayonInconnu,
  uneSuggestionDtoCommuneSansRayon,
  uneSuggestionDtoDeuxCommunes,
  uneSuggestionDtoUneCommuneEtUnDepartement,
  uneSuggestionDtoUneRegion
} from '../../../../../fixtures/pole-emploi.dto.fixture'
import { Suggestion } from '../../../../../../src/domain/offre/recherche/suggestion/suggestion'

describe('SuggestionPeHttpRepository', () => {
  let suggestionPeHttpRepository: SuggestionPeHttpRepository
  let client: StubbedClass<PoleEmploiPartenaireClient>

  beforeEach(() => {
    client = stubClass(PoleEmploiPartenaireClient)
    suggestionPeHttpRepository = new SuggestionPeHttpRepository(client)
  })

  describe('findAll', () => {
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
            informations: {
              localisation: 'FACHES THUMESNIL',
              metier: "Conduite d'engins de déplacement des charges",
              titre: 'Cariste'
            },
            rome: 'N1101',
            localisation: {
              code: '59220',
              type: 'COMMUNE',
              rayon: undefined
            },
            texteRecherche: 'Cariste'
          }
        ]
        expect(suggestions).to.deep.equal(success(expected))
      })
    })
    describe('une suggestion sur deux communes dont une avec rayon', () => {
      it('retourne une suggestion par commune', async () => {
        // Given
        client.getSuggestionsRecherches.resolves(
          success([uneSuggestionDtoDeuxCommunes()])
        )

        // When
        const suggestions = await suggestionPeHttpRepository.findAll('token')

        // Then
        const expected: Suggestion.PoleEmploi[] = [
          {
            informations: {
              localisation: 'FACHES THUMESNIL',
              metier: "Conduite d'engins de déplacement des charges",
              titre: 'Cariste'
            },
            rome: 'N1101',
            localisation: {
              code: '59220',
              type: 'COMMUNE',
              rayon: undefined
            },
            texteRecherche: 'Cariste'
          },
          {
            informations: {
              localisation: 'NANTES',
              metier: "Conduite d'engins de déplacement des charges",
              titre: 'Cariste'
            },
            rome: 'N1101',
            localisation: {
              code: '44300',
              type: 'COMMUNE',
              rayon: 10
            },
            texteRecherche: 'Cariste'
          }
        ]
        expect(suggestions).to.deep.equal(success(expected))
      })
    })
    describe('une suggestion sur une commune et un departement', () => {
      it('retourne une suggestion pour la commune et une pour le département', async () => {
        // Given
        client.getSuggestionsRecherches.resolves(
          success([uneSuggestionDtoUneCommuneEtUnDepartement()])
        )

        // When
        const suggestions = await suggestionPeHttpRepository.findAll('token')

        // Then
        const expected: Suggestion.PoleEmploi[] = [
          {
            informations: {
              localisation: 'Gironde',
              metier: "Conduite d'engins de déplacement des charges",
              titre: 'Cariste'
            },
            rome: 'N1101',
            localisation: {
              code: '33',
              type: 'DEPARTEMENT',
              rayon: undefined
            },
            texteRecherche: 'Cariste'
          },
          {
            informations: {
              localisation: 'NANTES',
              metier: "Conduite d'engins de déplacement des charges",
              titre: 'Cariste'
            },
            rome: 'N1101',
            localisation: {
              code: '44300',
              type: 'COMMUNE',
              rayon: 10
            },
            texteRecherche: 'Cariste'
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
            informations: {
              localisation: 'FACHES THUMESNIL',
              metier: "Conduite d'engins de déplacement des charges",
              titre: 'Cariste'
            },
            rome: 'N1101',
            localisation: {
              code: '59220',
              type: 'COMMUNE',
              rayon: undefined
            },
            texteRecherche: 'Cariste'
          }
        ]
        expect(suggestions).to.deep.equal(success(expected))
      })
    })
  })
})
