import { RafraichirSuggestionPoleEmploiCommandHandler } from '../../../src/application/commands/rafraichir-suggestion-pole-emploi.command.handler'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { expect, StubbedClass, stubClass } from '../../utils'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client'
import { createSandbox } from 'sinon'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  uneSuggestion,
  uneSuggestionPE
} from '../../fixtures/suggestion.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { SuggestionPoleEmploiService } from '../../../src/domain/offre/recherche/suggestion/pole-emploi.service'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'

describe('RafraichirSuggestionPoleEmploiCommandHandler', () => {
  let handler: RafraichirSuggestionPoleEmploiCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let suggestionFactory: StubbedClass<Suggestion.Factory>
  let suggestionPoleEmploiService: StubbedClass<SuggestionPoleEmploiService>
  let suggestionPoleEmploiRepository: StubbedType<Suggestion.PoleEmploi.Repository>
  let keycloakClient: StubbedClass<KeycloakClient>
  const jeune = unJeune()

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    suggestionFactory = stubClass(Suggestion.Factory)
    suggestionPoleEmploiService = stubClass(SuggestionPoleEmploiService)
    suggestionPoleEmploiRepository = stubInterface(sandbox)
    keycloakClient = stubClass(KeycloakClient)
    handler = new RafraichirSuggestionPoleEmploiCommandHandler(
      jeuneRepository,
      jeuneAuthorizer,
      suggestionFactory,
      suggestionPoleEmploiService,
      suggestionPoleEmploiRepository,
      keycloakClient
    )
  })

  describe('authorize', () => {
    it('autorise un jeune PE', async () => {
      // When
      await handler.authorize(
        {
          idJeune: 'idJeune',
          token: 'token',
          structure: Core.Structure.POLE_EMPLOI
        },
        unUtilisateurJeune()
      )

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly(
        'idJeune',
        unUtilisateurJeune(),
        Core.structuresPoleEmploiBRSA
      )
    })
  })

  describe('handle', () => {
    beforeEach(() => {
      jeuneRepository.get.resolves(jeune)
      keycloakClient.exchangeTokenJeune
        .withArgs('token', jeune.structure)
        .resolves('idpToken')
    })

    describe('quand Pole Emploi est up', () => {
      it('rafraichit les suggestions', async () => {
        // Given
        suggestionPoleEmploiRepository.findAll
          .withArgs('idpToken')
          .resolves(success([uneSuggestionPE()]))

        suggestionFactory.buildListeSuggestionsOffresFromPoleEmploi
          .withArgs([uneSuggestionPE()], 'idJeune', Core.Structure.MILO)
          .returns([uneSuggestion()])

        // When
        await handler.handle({
          idJeune: 'idJeune',
          token: 'token',
          structure: Core.Structure.MILO
        })

        // Then
        expect(
          suggestionPoleEmploiService.rafraichir
        ).to.have.been.calledWithExactly([uneSuggestion()], 'idJeune')
      })
    })

    describe('quand Pole Emploi est down', () => {
      it("retourne l'erreur", async () => {
        // Given
        suggestionPoleEmploiRepository.findAll.resolves(
          failure(new ErreurHttp('Service down', 500))
        )

        // When
        const result = await handler.handle({
          idJeune: 'idJeune',
          token: 'token',
          structure: Core.Structure.MILO
        })

        // Then
        expect(result).to.deep.equal(
          failure(new ErreurHttp('Service down', 500))
        )
      })
    })
  })
})
