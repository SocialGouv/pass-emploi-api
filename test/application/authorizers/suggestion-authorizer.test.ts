import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SuggestionAuthorizer } from 'src/application/authorizers/suggestion-authorizer'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Suggestion } from 'src/domain/offre/recherche/suggestion/suggestion'
import { uneSuggestion } from 'test/fixtures/suggestion.fixture'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'

describe('SuggestionAuthorizer', () => {
  let suggestionRepository: StubbedType<Suggestion.Repository>
  let suggestionAuthorizer: SuggestionAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    suggestionRepository = stubInterface(sandbox)
    suggestionAuthorizer = new SuggestionAuthorizer(suggestionRepository)
  })

  describe('autoriserJeunePourSaSuggestion', () => {
    describe('quand la suggestion existe et est liée au jeune', () => {
      it('retourne un success', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const suggestion = uneSuggestion()

        suggestionRepository.get.withArgs(suggestion.id).resolves(suggestion)

        // When
        const result =
          await suggestionAuthorizer.autoriserJeunePourSaSuggestion(
            utilisateur.id,
            suggestion.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le jeune n'est pas lié à la suggestion", () => {
      it('retourne une failure', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const suggestion = uneSuggestion()

        suggestionRepository.get
          .withArgs(suggestion.id)
          .resolves({ ...suggestion, idJeune: 'un-autre-jeune' })

        // When
        const result =
          await suggestionAuthorizer.autoriserJeunePourSaSuggestion(
            utilisateur.id,
            suggestion.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe("quand la suggestion n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const suggestion = uneSuggestion()

        suggestionRepository.get.withArgs(suggestion.id).resolves(undefined)

        // When
        const result =
          await suggestionAuthorizer.autoriserJeunePourSaSuggestion(
            utilisateur.id,
            suggestion.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
