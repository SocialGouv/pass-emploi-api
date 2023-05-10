import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox, createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  CreateSuggestionConseillerOffreEmploiCommand,
  CreateSuggestionConseillerOffreEmploiCommandHandler
} from '../../../src/application/commands/create-suggestion-conseiller-offre-emploi.command.handler'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError
} from '../../../src/building-blocks/types/domain-error'
import {
  Failure,
  failure,
  isFailure
} from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
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
  let createSuggestionDuConseillerOffreEmploiCommandHandler: CreateSuggestionConseillerOffreEmploiCommandHandler
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

    createSuggestionDuConseillerOffreEmploiCommandHandler =
      new CreateSuggestionConseillerOffreEmploiCommandHandler(
        conseillerAuthorizer,
        suggestionRepository,
        suggestionFactory,
        jeuneRepository,
        evenementService
      )
  })

  describe('authorize', () => {
    it('autorise le conseiller identifié', async () => {
      // Given
      const idConseiller = 'id-conseiller'
      const utilisateur = unUtilisateurConseiller({ id: idConseiller })
      const command = {
        idConseiller,
        idsJeunes: [],
        localisation: 'Denain',
        criteres: {
          q: 'Petrisseur',
          commune: '59220'
        }
      }
      // When
      await createSuggestionDuConseillerOffreEmploiCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(command.idConseiller, utilisateur)
    })
    it('autorise le conseiller BRSA pour une offre', async () => {
      // Given
      const idConseiller = 'id-conseiller'
      const utilisateur = unUtilisateurConseiller({
        id: idConseiller,
        structure: Core.Structure.POLE_EMPLOI_BRSA
      })
      const command = {
        idConseiller,
        idsJeunes: [],
        localisation: 'Denain',
        criteres: {
          q: 'Petrisseur',
          commune: '59220'
        }
      }
      // When
      await createSuggestionDuConseillerOffreEmploiCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(command.idConseiller, utilisateur)
    })
    it('rejette un conseiller BRSA pour une alternance', async () => {
      // Given
      const idConseiller = 'id-conseiller'
      const utilisateur = unUtilisateurConseiller({
        id: idConseiller,
        structure: Core.Structure.POLE_EMPLOI_BRSA
      })
      const command = {
        idConseiller,
        idsJeunes: [],
        localisation: 'Denain',
        criteres: {
          q: 'Petrisseur',
          commune: '59220',
          alternance: 'true'
        }
      }
      // When
      const result =
        await createSuggestionDuConseillerOffreEmploiCommandHandler.authorize(
          command,
          utilisateur
        )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).not.to.have.been.called()
    })
  })

  describe('handle', () => {
    describe('quand un jeune n’est pas trouvé', () => {
      it('retourne une MauvaiseCommandeError', async () => {
        // Given
        const idConseiller = 'id-conseiller'
        const idJeuneTrouve = 'id-jeune-1'
        const idJeuneNonTrouve = 'id-jeune-2'
        const criteres: Recherche.Emploi = {
          q: 'Petrisseur',
          commune: '59220'
        }
        const suggestionConseillerCommand = {
          idConseiller,
          idsJeunes: [idJeuneTrouve, idJeuneNonTrouve],
          localisation: 'Denain',
          criteres
        }

        jeuneRepository.findAllJeunesByIdsAndConseiller.resolves([
          unJeune({
            id: idJeuneTrouve,
            conseiller: unConseiller({ id: idConseiller })
          })
        ])

        // When
        const result =
          await createSuggestionDuConseillerOffreEmploiCommandHandler.handle(
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

        const criteres: Recherche.Emploi = {
          q: 'Petrisseur',
          commune: '59220',
          departement: undefined
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
        await createSuggestionDuConseillerOffreEmploiCommandHandler.handle(
          suggestionConseillerCommand
        )

        // Then
        expect(suggestionRepository.save).to.have.been.calledWith(
          suggestionAttendueJeune
        )
      })
      it('enregistre la suggestion avec le type alternance', async () => {
        // Given
        const idConseiller = 'id-conseiller'
        const idJeune = 'id-jeune'
        jeuneRepository.findAllJeunesByIdsAndConseiller.resolves([
          unJeune({
            id: idJeune,
            conseiller: unConseiller({ id: idConseiller })
          })
        ])

        const criteres: Recherche.Emploi = {
          q: 'Petrisseur',
          commune: '59220',
          departement: undefined,
          alternance: 'true'
        }
        const suggestionConseillerCommand = {
          idConseiller,
          idsJeunes: [idJeune],
          localisation: 'Denain',
          criteres
        }
        const suggestionAttendueJeune = uneSuggestion({
          idJeune,
          criteres,
          type: Recherche.Type.OFFRES_ALTERNANCE
        })
        suggestionFactory.creerSuggestionConseiller.returns(
          suggestionAttendueJeune
        )

        // When
        await createSuggestionDuConseillerOffreEmploiCommandHandler.handle(
          suggestionConseillerCommand
        )

        // Then
        expect(
          suggestionFactory.creerSuggestionConseiller
        ).to.have.been.calledWith(Recherche.Type.OFFRES_ALTERNANCE)
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
      const criteres: Recherche.Emploi = {
        q: 'Petrisseur',
        commune: '59220'
      }
      const command: CreateSuggestionConseillerOffreEmploiCommand = {
        idConseiller: 'un-id-conseiller',
        idsJeunes: ['un-id-jeune'],
        localisation: 'Denain',
        criteres
      }

      // When
      createSuggestionDuConseillerOffreEmploiCommandHandler.monitor(
        utilisateur,
        command
      )

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RECHERCHE_EMPLOI_SUGGEREE,
        utilisateur
      )
    })
    it('créé un événement suggestion alternance', () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      const criteres: Recherche.Emploi = {
        q: 'Petrisseur',
        commune: '59220',
        alternance: 'true'
      }
      const command: CreateSuggestionConseillerOffreEmploiCommand = {
        idConseiller: 'un-id-conseiller',
        idsJeunes: ['un-id-jeune'],
        localisation: 'Denain',
        criteres
      }

      // When
      createSuggestionDuConseillerOffreEmploiCommandHandler.monitor(
        utilisateur,
        command
      )

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RECHERCHE_ALTERNANCE_SUGGEREE,
        utilisateur
      )
    })
  })
})
