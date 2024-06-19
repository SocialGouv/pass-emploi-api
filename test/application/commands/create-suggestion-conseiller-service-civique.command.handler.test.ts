import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox, createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  CreateSuggestionConseillerServiceCiviqueCommand,
  CreateSuggestionConseillerServiceCiviqueCommandHandler
} from '../../../src/application/commands/create-suggestion-conseiller-service-civique.command.handler'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'
import { Failure, isFailure } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { aAccesAuxAlternancesEtServicesCiviques } from '../../../src/domain/core'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneSuggestion } from '../../fixtures/suggestion.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import Suggestion = Recherche.Suggestion

describe('CreateSuggestionDuConseillerServiceCiviqueCommandHandler', () => {
  let createSuggestionDuConseillerServiceCiviqueCommandHandler: CreateSuggestionConseillerServiceCiviqueCommandHandler
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

    createSuggestionDuConseillerServiceCiviqueCommandHandler =
      new CreateSuggestionConseillerServiceCiviqueCommandHandler(
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
    let command: CreateSuggestionConseillerServiceCiviqueCommand

    beforeEach(() => {
      // Given
      idConseiller = 'id-conseiller'
      utilisateur = unUtilisateurConseiller({ id: idConseiller })
      command = {
        idConseiller,
        idsJeunes: [],
        localisation: 'ici',
        criteres: {
          lat: 13,
          lon: 32
        }
      }
    })
    it('autorise le conseiller identifié', async () => {
      // When
      await createSuggestionDuConseillerServiceCiviqueCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur,
        aAccesAuxAlternancesEtServicesCiviques(utilisateur.structure)
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
        const criteres: Recherche.ServiceCivique = {
          lat: 12,
          lon: 13
        }
        const suggestionConseillerCommand = {
          idConseiller,
          idsJeunes: [idJeuneTrouve, idJeuneNonTrouve],
          localisation: 'Denain',
          criteres
        }

        jeuneRepository.findAllJeunesByIdsAndConseiller.resolves([
          idJeuneTrouve
        ])

        // When
        const result =
          await createSuggestionDuConseillerServiceCiviqueCommandHandler.handle(
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
        jeuneRepository.findAllJeunesByIdsAndConseiller.resolves([
          unJeune({
            id: idJeune,
            conseiller: unConseiller({ id: idConseiller })
          })
        ])

        const criteres: Recherche.ServiceCivique = {
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
        await createSuggestionDuConseillerServiceCiviqueCommandHandler.handle(
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
      createSuggestionDuConseillerServiceCiviqueCommandHandler.monitor(
        utilisateur
      )

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SUGGEREE,
        utilisateur
      )
    })
  })
})
