import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuggestionAuthorizer } from 'src/application/authorizers/authorize-suggestion'
import { MauvaiseCommandeError } from 'src/building-blocks/types/domain-error'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { RefuserSuggestionCommandHandler } from '../../../src/application/commands/refuser-suggestion.command.handler'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('RefuserSuggestionCommandHandler', () => {
  let refuserSuggestionCommandHandler: RefuserSuggestionCommandHandler
  let suggestionAuthorizer: StubbedClass<SuggestionAuthorizer>
  let suggestionRepository: StubbedType<Suggestion.Repository>
  let suggestionFactory: StubbedClass<Suggestion.Factory>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    suggestionAuthorizer = stubClass(SuggestionAuthorizer)
    suggestionRepository = stubInterface(sandbox)
    suggestionFactory = stubClass(Suggestion.Factory)

    refuserSuggestionCommandHandler = new RefuserSuggestionCommandHandler(
      suggestionAuthorizer,
      suggestionRepository,
      suggestionFactory
    )
  })
  describe('authorize', () => {
    it('autorise le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }

      // When
      await refuserSuggestionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(suggestionAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idSuggestion,
        command.idJeune,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    describe("quand la suggestion n'est pas traitée", () => {
      it('met à jour la date de suppression', async () => {
        // Given
        const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }

        const suggestion = uneSuggestion({
          id: command.idSuggestion,
          idJeune: command.idJeune
        })
        const suggestionRefusee = {
          ...suggestion,
          dateRefus: uneDatetime
        }
        suggestionRepository.get.resolves(suggestion)
        suggestionFactory.refuser.returns(suggestionRefusee)

        // When
        const result = await refuserSuggestionCommandHandler.handle(command)

        // Then
        expect(suggestionRepository.save).to.have.been.calledWithExactly(
          suggestionRefusee
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
  describe('quand la suggestion est déjà traitée', () => {
    it('retourne une failure quand elle a été acceptée', async () => {
      // Given
      const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }
      suggestionRepository.get.resolves(
        uneSuggestion({ dateCreationRecherche: uneDatetime })
      )

      // When
      const result = await refuserSuggestionCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Suggestion déjà traitée'))
      )
    })
    it('retourne une failure quand elle a été refusée', async () => {
      // Given
      const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }
      suggestionRepository.get.resolves(
        uneSuggestion({ dateRefus: uneDatetime })
      )

      // When
      const result = await refuserSuggestionCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Suggestion déjà traitée'))
      )
    })
  })
})
