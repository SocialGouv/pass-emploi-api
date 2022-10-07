import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuggestionAuthorizer } from 'src/application/authorizers/authorize-suggestion'
import { IdService } from 'src/utils/id-service'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { uneRecherche } from 'test/fixtures/recherche.fixture'
import { CreateRechercheFromSuggestionCommandHandler } from '../../../src/application/commands/create-recherche-from-suggestion.command.handler'
import { success } from '../../../src/building-blocks/types/result'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('CreateRechercheFromSuggestionCommandHandler', () => {
  let createRechercheFromSuggestionCommandHandler: CreateRechercheFromSuggestionCommandHandler
  let suggestionAuthorizer: StubbedClass<SuggestionAuthorizer>
  let rechercheFactory: StubbedClass<Recherche.Factory>
  let suggestionFactory: StubbedClass<Suggestion.Factory>
  let dateService: StubbedClass<DateService>
  let idService: StubbedClass<IdService>
  let suggestionRepository: StubbedType<Suggestion.Repository>
  let rechercheRepository: StubbedType<Recherche.Repository>

  const idRecherche = '6fa1e060-ccc4-4d35-89d3-7b14178c7a5b'
  const dateCreationRecherche = uneDatetime()

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    suggestionAuthorizer = stubClass(SuggestionAuthorizer)
    rechercheFactory = stubClass(Recherche.Factory)
    suggestionFactory = stubClass(Suggestion.Factory)
    dateService = stubClass(DateService)
    dateService.now.returns(dateCreationRecherche)
    idService = stubClass(IdService)
    idService.uuid.returns(idRecherche)
    suggestionRepository = stubInterface(sandbox)
    rechercheRepository = stubInterface(sandbox)

    createRechercheFromSuggestionCommandHandler =
      new CreateRechercheFromSuggestionCommandHandler(
        suggestionAuthorizer,
        suggestionRepository,
        rechercheRepository,
        rechercheFactory,
        suggestionFactory
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
      expect(suggestionAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idSuggestion,
        command.idJeune,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    describe("quand la suggestion n'est pas acceptée", () => {
      it('crée une recherche à partir de la suggestion', async () => {
        // Given
        const command = { idJeune: 'id-jeune', idSuggestion: 'id-suggestion' }

        const suggestion = uneSuggestion({
          id: command.idSuggestion,
          idJeune: command.idJeune
        })
        const suggestionAcceptee = {
          ...suggestion,
          dateCreationRecherche: dateCreationRecherche,
          idRecherche
        }
        const recherche = uneRecherche({
          id: idRecherche,
          type: suggestionAcceptee.type,
          titre: suggestionAcceptee.informations.titre,
          metier: suggestionAcceptee.informations.metier,
          localisation: suggestionAcceptee.informations.localisation,
          criteres: suggestionAcceptee.criteres,
          idJeune: command.idJeune,
          dateCreation: dateCreationRecherche,
          dateDerniereRecherche: dateCreationRecherche
        })

        suggestionRepository.get.resolves(suggestion)
        suggestionFactory.accepter.returns(success(suggestionAcceptee))
        rechercheFactory.buildRechercheFromSuggestion.returns(recherche)

        // When
        const result = await createRechercheFromSuggestionCommandHandler.handle(
          command
        )

        // Then
        expect(
          rechercheFactory.buildRechercheFromSuggestion
        ).to.have.been.calledWithExactly(suggestionAcceptee)
        expect(rechercheRepository.save).to.have.been.calledWithExactly(
          recherche
        )
        expect(suggestionRepository.save).to.have.been.calledWithExactly(
          suggestionAcceptee
        )
        expect(result).to.deep.equal(success(recherche))
      })
    })
  })
})
