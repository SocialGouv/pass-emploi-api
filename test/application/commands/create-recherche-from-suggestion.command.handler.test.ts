import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { SuggestionAuthorizer } from 'src/application/authorizers/suggestion-authorizer'
import { IdService } from 'src/utils/id-service'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { uneRecherche } from 'test/fixtures/recherche.fixture'
import {
  CreateRechercheFromSuggestionCommand,
  CreateRechercheFromSuggestionCommandHandler
} from '../../../src/application/commands/create-recherche-from-suggestion.command.handler'
import { success } from '../../../src/building-blocks/types/result'
import { EvenementService } from '../../../src/domain/evenement'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { DateService } from '../../../src/utils/date-service'
import {
  unUtilisateurDecode,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'

describe('CreateRechercheFromSuggestionCommandHandler', () => {
  let createRechercheFromSuggestionCommandHandler: CreateRechercheFromSuggestionCommandHandler
  let suggestionAuthorizer: StubbedClass<SuggestionAuthorizer>
  let rechercheFactory: StubbedClass<Recherche.Factory>
  let suggestionFactory: StubbedClass<Suggestion.Factory>
  let dateService: StubbedClass<DateService>
  let idService: StubbedClass<IdService>
  let suggestionRepository: StubbedType<Suggestion.Repository>
  let rechercheRepository: StubbedType<Recherche.Repository>
  let evenementService: StubbedClass<EvenementService>

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
    evenementService = stubClass(EvenementService)

    createRechercheFromSuggestionCommandHandler =
      new CreateRechercheFromSuggestionCommandHandler(
        suggestionAuthorizer,
        suggestionRepository,
        rechercheRepository,
        rechercheFactory,
        suggestionFactory,
        evenementService
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
      expect(
        suggestionAuthorizer.autoriserJeunePourSaSuggestion
      ).to.have.been.calledWithExactly(
        command.idJeune,
        command.idSuggestion,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    describe('quand la suggestion est acceptée', () => {
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
        ).to.have.been.calledWithExactly(suggestionAcceptee, undefined)
        expect(rechercheRepository.save).to.have.been.calledWithExactly(
          recherche
        )
        expect(suggestionRepository.save).to.have.been.calledWithExactly(
          suggestionAcceptee
        )
        expect(result).to.deep.equal(success(recherche))
      })

      it('avec des critères, crée une recherche à partir de la suggestion', async () => {
        // Given
        const criteres = {
          q: 'Boulanger',
          commune: '78530',
          departement: undefined,
          rayon: 10
        }

        const command = {
          idJeune: 'id-jeune',
          idSuggestion: 'id-suggestion',
          criteres: criteres
        }

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
          criteres: criteres,
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
        ).to.have.been.calledWithExactly(suggestionAcceptee, criteres)
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

  describe('monitor', () => {
    it('enregistre l‘évènement', async () => {
      // Given
      const command: CreateRechercheFromSuggestionCommand = {
        idJeune: 'id-jeune',
        idSuggestion: 'id-suggestion'
      }

      // When
      await createRechercheFromSuggestionCommandHandler.monitor(
        unUtilisateurDecode(),
        command
      )

      // Then
      expect(
        evenementService.creerEvenementSuggestion
      ).to.have.been.calledWithExactly(
        unUtilisateurDecode(),
        command.idSuggestion
      )
    })
  })
})
