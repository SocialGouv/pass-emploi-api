import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { expect, StubbedClass, stubClass } from '../../utils'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { createSandbox } from 'sinon'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  uneSuggestion,
  uneSuggestionPE
} from '../../fixtures/suggestion.fixture'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { SuggestionPoleEmploiService } from '../../../src/domain/offre/recherche/suggestion/pole-emploi.service'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { DiagorienteClient } from 'src/infrastructure/clients/diagoriente-client'
import { Diagoriente } from 'src/domain/offre/recherche/suggestion/diagoriente'
import { Recherche } from 'src/domain/offre/recherche/recherche'
import { RafraichirSuggestionsCommandHandler } from 'src/application/commands/rafraichir-suggestions.command.handler'

describe('RafraichirSuggestionPoleEmploiCommandHandler', () => {
  let handler: RafraichirSuggestionsCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let suggestionFactory: StubbedClass<Suggestion.Factory>
  let suggestionPoleEmploiService: StubbedClass<SuggestionPoleEmploiService>
  let diagorienteClient: StubbedClass<DiagorienteClient>
  let suggestionPoleEmploiRepository: StubbedType<Suggestion.PoleEmploi.Repository>
  let oidcClient: StubbedClass<OidcClient>
  const jeune = unJeune()

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    suggestionFactory = stubClass(Suggestion.Factory)
    suggestionPoleEmploiService = stubClass(SuggestionPoleEmploiService)
    diagorienteClient = stubClass(DiagorienteClient)
    suggestionPoleEmploiRepository = stubInterface(sandbox)
    oidcClient = stubClass(OidcClient)
    handler = new RafraichirSuggestionsCommandHandler(
      jeuneRepository,
      jeuneAuthorizer,
      suggestionFactory,
      suggestionPoleEmploiService,
      diagorienteClient,
      suggestionPoleEmploiRepository,
      oidcClient
    )
  })

  describe('authorize', () => {
    it('autorise un jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await handler.authorize(
        {
          idJeune: 'idJeune',
          accessToken: 'token',
          structure: Core.Structure.POLE_EMPLOI,
          avecDiagoriente: false
        },
        utilisateur
      )

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly('idJeune', utilisateur)
    })
  })

  describe('handle', () => {
    beforeEach(() => {
      jeuneRepository.get.resolves(jeune)
      oidcClient.exchangeTokenJeune
        .withArgs('token', jeune.structure)
        .resolves('idpToken')
    })

    describe("quand l'utilisateur a une structure MILO", () => {
      it('recupere suggestions PE et Diagoriente', async () => {
        const suggestionDiagoriente: Diagoriente = {
          tag: {
            code: 'B1301',
            id: '1',
            title: "Décoration d'espaces de vente et d'exposition"
          },
          id: '1',
          favorited: true
        }

        const suggestionDiagorienteOffreEmploi: Suggestion = uneSuggestion({
          source: Suggestion.Source.DIAGORIENTE,
          type: Recherche.Type.OFFRES_EMPLOI,
          informations: {
            metier: suggestionDiagoriente.tag.title,
            titre: suggestionDiagoriente.tag.title
          }
        })

        const suggestionDiagorienteImmersion: Suggestion = uneSuggestion({
          source: Suggestion.Source.DIAGORIENTE,
          type: Recherche.Type.OFFRES_IMMERSION,
          informations: {
            metier: suggestionDiagoriente.tag.title,
            titre: suggestionDiagoriente.tag.title
          }
        })

        diagorienteClient.getMetiersFavoris.resolves(
          success({
            data: {
              userByPartner: {
                favorites: [suggestionDiagoriente]
              }
            }
          })
        )

        suggestionFactory.buildListeSuggestionsOffresFromDiagoriente
          .withArgs([suggestionDiagoriente], 'idJeune')
          .returns([
            suggestionDiagorienteOffreEmploi,
            suggestionDiagorienteImmersion
          ])

        // When
        await handler.handle({
          idJeune: 'idJeune',
          accessToken: 'token',
          structure: Core.Structure.MILO,
          avecDiagoriente: true
        })

        // Then
        expect(
          suggestionPoleEmploiService.rafraichir
        ).to.have.been.calledWithExactly(
          [suggestionDiagorienteOffreEmploi, suggestionDiagorienteImmersion],
          'idJeune'
        )
      })
    })

    describe('quand Pole Emploi est up', () => {
      it('rafraichit les suggestions', async () => {
        // Given
        suggestionPoleEmploiRepository.findAll
          .withArgs('idpToken')
          .resolves(success([uneSuggestionPE()]))

        suggestionFactory.buildListeSuggestionsOffresFromPoleEmploi
          .withArgs([uneSuggestionPE()], 'idJeune', Core.Structure.POLE_EMPLOI)
          .returns([uneSuggestion()])

        // When
        await handler.handle({
          idJeune: 'idJeune',
          accessToken: 'token',
          structure: Core.Structure.POLE_EMPLOI,
          avecDiagoriente: false
        })

        // Then
        expect(
          suggestionPoleEmploiService.rafraichir
        ).to.have.been.calledWithExactly([uneSuggestion()], 'idJeune')
      })
      it('récupère les métiers favoris diagoriente et rafraichit les suggestions', async () => {
        const suggestionDiagoriente: Diagoriente = {
          tag: {
            code: 'B1301',
            id: '1',
            title: "Décoration d'espaces de vente et d'exposition"
          },
          id: '1',
          favorited: true
        }

        const suggestionDiagorienteOffreEmploi: Suggestion = uneSuggestion({
          source: Suggestion.Source.DIAGORIENTE,
          type: Recherche.Type.OFFRES_EMPLOI,
          informations: {
            titre: suggestionDiagoriente.tag.title
          }
        })

        const suggestionDiagorienteImmersion: Suggestion = uneSuggestion({
          source: Suggestion.Source.DIAGORIENTE,
          type: Recherche.Type.OFFRES_IMMERSION,
          informations: {
            titre: suggestionDiagoriente.tag.title
          }
        })

        // Given
        suggestionPoleEmploiRepository.findAll
          .withArgs('idpToken')
          .resolves(success([uneSuggestionPE()]))

        diagorienteClient.getMetiersFavoris.resolves(
          success({
            data: {
              userByPartner: {
                favorites: [suggestionDiagoriente]
              }
            }
          })
        )

        suggestionFactory.buildListeSuggestionsOffresFromPoleEmploi
          .withArgs([uneSuggestionPE()], 'idJeune', Core.Structure.POLE_EMPLOI)
          .returns([uneSuggestion()])

        suggestionFactory.buildListeSuggestionsOffresFromDiagoriente
          .withArgs([suggestionDiagoriente], 'idJeune')
          .returns([
            suggestionDiagorienteOffreEmploi,
            suggestionDiagorienteImmersion
          ])

        // When
        await handler.handle({
          idJeune: 'idJeune',
          accessToken: 'token',
          structure: Core.Structure.POLE_EMPLOI,
          avecDiagoriente: true
        })

        // Then
        expect(
          suggestionPoleEmploiService.rafraichir
        ).to.have.been.calledWithExactly(
          [
            uneSuggestion(),
            suggestionDiagorienteOffreEmploi,
            suggestionDiagorienteImmersion
          ],
          'idJeune'
        )
      })
    })

    describe('quand Pole Emploi et Diago sont down', () => {
      it("ne retourne pas l'erreur", async () => {
        // Given
        suggestionPoleEmploiRepository.findAll.resolves(
          failure(new ErreurHttp('Service down', 500))
        )
        diagorienteClient.getMetiersFavoris.resolves(
          failure(new ErreurHttp('Service down', 500))
        )

        // When
        const result = await handler.handle({
          idJeune: 'idJeune',
          accessToken: 'token',
          structure: Core.Structure.POLE_EMPLOI,
          avecDiagoriente: true
        })

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
})
