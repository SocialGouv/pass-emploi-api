import { CreateRechercheFromSuggestionCommandHandler } from '../../../src/application/commands/create-recherche-from-suggestion.command.handler'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { DateService } from '../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { DateTime } from 'luxon'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

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
    describe('quand la suggestion du jeune est trouvée', () => {
      it('met à jour la date de suppression', async () => {
        // Given
        const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }
        const dateCreationRecherche = DateTime.fromISO(
          '2022-09-28T14:00:00.000Z'
        )
        const suggestionAvantCreate = uneSuggestion({
          id: command.idSuggestion,
          idJeune: command.idJeune
        })
        const suggestionApresCreate = uneSuggestion({
          id: command.idSuggestion,
          idJeune: command.idJeune,
          dateCreationRecherche
        })
        suggestionRepository.findByIdAndIdJeune.resolves(suggestionAvantCreate)
        dateService.now.returns(dateCreationRecherche)

        // When
        const result = await createRechercheFromSuggestionCommandHandler.handle(
          command
        )

        // Then
        expect(
          rechercheFactory.buildRechercheFromSuggestion
        ).to.have.been.calledWithExactly(
          suggestionAvantCreate,
          dateCreationRecherche
        )
        expect(suggestionRepository.save).to.have.been.calledWithExactly(
          suggestionApresCreate
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
        const result = await createRechercheFromSuggestionCommandHandler.handle(
          command
        )

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Suggestion', command.idSuggestion))
        )
      })
    })
  })
})
