import { CreateRechercheFromSuggestionCommandHandler } from '../../../src/application/commands/create-recherche-from-suggestion.command.handler'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { DateService } from '../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'

describe('CreateRechercheFromSuggestionCommandHandler', () => {
  let createRechercheFromSuggestionCommandHandler: CreateRechercheFromSuggestionCommandHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let rechercheFactory: StubbedClass<Recherche.Factory>
  let dateService: StubbedClass<DateService>
  let suggestionRepository: StubbedType<Suggestion.Repository>
  let rechercheRepository: StubbedType<Recherche.Repository>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    rechercheFactory = stubClass(Recherche.Factory)
    dateService = stubClass(DateService)
    suggestionRepository = stubInterface(sandbox)
    rechercheRepository = stubInterface(sandbox)

    createRechercheFromSuggestionCommandHandler =
      new CreateRechercheFromSuggestionCommandHandler(
        jeuneAuthorizer,
        suggestionRepository,
        rechercheRepository,
        rechercheFactory,
        dateService
      )
  })
  describe('authorize', () => {
    it('autorise le jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }

      // When
      await createRechercheFromSuggestionCommandHandler.authorize(
        command,
        utilisateur
      )

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
