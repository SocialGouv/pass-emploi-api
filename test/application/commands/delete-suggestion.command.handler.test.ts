import { DeleteSuggestionCommandHandler } from '../../../src/application/commands/delete-suggestion.command.handler'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { DateService } from '../../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { SinonSandbox } from 'sinon'

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
    it('', async () => {
      // Given
      // When
      // Then
    })
  })
})
