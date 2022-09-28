import { DeleteSuggestionCommandHandler } from '../../../src/application/commands/delete-suggestion.command.handler'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { DateService } from '../../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { SinonSandbox } from 'sinon'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import { DateTime } from 'luxon'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

describe('DeleteSuggestionCommandHandler', () => {
  let deleteSuggestionCommandHandler: DeleteSuggestionCommandHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let dateService: StubbedClass<DateService>
  let suggestionRepository: StubbedType<Suggestion.Repository>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    suggestionRepository = stubInterface(sandbox)

    deleteSuggestionCommandHandler = new DeleteSuggestionCommandHandler(
      jeuneAuthorizer,
      suggestionRepository,
      dateService
    )
  })
  describe('authorize', () => {
    it('autorise le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }

      // When
      await deleteSuggestionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idJeune,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    describe('quand la suggestion du jeune est trouvée', () => {
      it('met à jour la date de suppression', async () => {
        // Given
        const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }
        const dateSuppression = DateTime.fromISO('2022-09-28T14:00:00.000Z')
        const suggestionAvantDelete = uneSuggestion({
          id: command.idSuggestion,
          idJeune: command.idJeune
        })
        const suggestionApresDelete = uneSuggestion({
          id: command.idSuggestion,
          idJeune: command.idJeune,
          dateSuppression
        })
        suggestionRepository.findByIdAndIdJeune.resolves(suggestionAvantDelete)
        dateService.now.returns(dateSuppression)

        // When
        const result = await deleteSuggestionCommandHandler.handle(command)

        // Then
        expect(suggestionRepository.save).to.have.been.calledWithExactly(
          suggestionApresDelete
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand la suggestion du jeune n’est pas trouvée', () => {
      it('retourne une NonTrouveError', async () => {
        // Given
        const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }
        suggestionRepository.findByIdAndIdJeune.resolves(undefined)

        // When
        const result = await deleteSuggestionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Suggestion', command.idSuggestion))
        )
      })
    })
  })
})
