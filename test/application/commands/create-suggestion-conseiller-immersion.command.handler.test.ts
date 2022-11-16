import { expect, StubbedClass, stubClass } from '../../utils'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { createSandbox, SinonSandbox } from 'sinon'
import { Authentification } from '../../../src/domain/authentification'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import {
  CreateSuggestionConseillerImmersionCommand,
  CreateSuggestionConseillerImmersionCommandHandler
} from '../../../src/application/commands/create-suggestion-conseiller-immersion.command.handler'
import { Failure, isFailure } from '../../../src/building-blocks/types/result'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import { Suggestion } from '../../../src/domain/offre/recherche/suggestion/suggestion'
import { Evenement, EvenementService } from '../../../src/domain/evenement'

describe('CreateSuggestionDuConseillerServiceCiviqueCommandHandler', () => {
  let createSuggestionDuConseillerImmersionCommandHandler: CreateSuggestionConseillerImmersionCommandHandler
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let suggestionRepository: StubbedType<Suggestion.Repository>
  let suggestionFactory: StubbedClass<Suggestion.Factory>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    suggestionRepository = stubInterface(sandbox)
    suggestionFactory = stubClass(Suggestion.Factory)
    jeuneRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)

    createSuggestionDuConseillerImmersionCommandHandler =
      new CreateSuggestionConseillerImmersionCommandHandler(
        conseillerAuthorizer,
        suggestionRepository,
        suggestionFactory,
        jeuneRepository,
        evenementService
      )
  })

  describe('authorize', () => {
    let idConseiller
    let utilisateur: Authentification.Utilisateur
    let command: CreateSuggestionConseillerImmersionCommand

    beforeEach(() => {
      // Given
      idConseiller = 'id-conseiller'
      utilisateur = unUtilisateurConseiller({ id: idConseiller })
      command = {
        idConseiller,
        idsJeunes: [],
        localisation: 'ici',
        criteres: {
          rome: 'Boulanger',
          lat: 13,
          lon: 32
        }
      }
    })
    it('autorise le conseiller identifié', async () => {
      // When
      await createSuggestionDuConseillerImmersionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    describe('quand un jeune n’est pas trouvé', () => {
      it('retourne une MauvaiseCommandeError', async () => {
        // Given
        const idConseiller = 'id-conseiller'
        const idJeuneTrouve = 'id-jeune-1'
        const idJeuneNonTrouve = 'id-jeune-2'
        const criteres: Recherche.Immersion = {
          rome: 'Petrisseur',
          lat: 12,
          lon: 13
        }
        const suggestionConseillerCommand = {
          idConseiller,
          idsJeunes: [idJeuneTrouve, idJeuneNonTrouve],
          localisation: 'Denain',
          criteres
        }

        jeuneRepository.findAllJeunesByConseiller.resolves([idJeuneTrouve])

        // When
        const result =
          await createSuggestionDuConseillerImmersionCommandHandler.handle(
            suggestionConseillerCommand
          )
        // Then
        expect(isFailure(result)).to.equal(true)
        expect((result as Failure).error).to.be.an.instanceof(
          MauvaiseCommandeError
        )
        expect(jeuneRepository.save).not.to.have.been.called()
      })
    })
    describe('quand tous les jeunes existent', () => {
      it('enregistre la suggestion', async () => {
        // Given
        const idConseiller = 'id-conseiller'
        const idJeune = 'id-jeune'
        jeuneRepository.findAllJeunesByConseiller.resolves([
          unJeune({
            id: idJeune,
            conseiller: unConseiller({ id: idConseiller })
          })
        ])

        const criteres: Recherche.Immersion = {
          rome: 'Petrisseur',
          lat: 12,
          lon: 13
        }
        const suggestionConseillerCommand = {
          idConseiller,
          idsJeunes: [idJeune],
          localisation: 'Denain',
          criteres
        }
        const suggestionAttendueJeune = uneSuggestion({
          idJeune,
          criteres
        })
        suggestionFactory.creerSuggestionConseiller.returns(
          suggestionAttendueJeune
        )

        // When
        await createSuggestionDuConseillerImmersionCommandHandler.handle(
          suggestionConseillerCommand
        )

        // Then
        expect(suggestionRepository.save).to.have.been.calledWith(
          suggestionAttendueJeune
        )
      })
    })
  })

  describe('monitor', () => {
    it('créé un événement suggestion emploi', () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      // When
      createSuggestionDuConseillerImmersionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RECHERCHE_IMMERSION_SUGGEREE,
        utilisateur
      )
    })
  })
})
