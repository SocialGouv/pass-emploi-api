import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { ActionAuthorizer } from '../../../../src/application/authorizers/authorize-action'
import {
  DeleteActionCommand,
  DeleteActionCommandHandler
} from '../../../../src/application/commands/action/delete-action.command.handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../../src/building-blocks/types/result'
import { Action } from '../../../../src/domain/action/action'
import {
  unCommentaire,
  uneAction,
  uneActionTerminee
} from '../../../fixtures/action.fixture'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('DeleteActionCommandHandler', () => {
  let action: Action
  let actionRepository: StubbedType<Action.Repository>
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let deleteActionCommandHandler: DeleteActionCommandHandler
  let evenementService: StubbedClass<EvenementService>

  beforeEach(async () => {
    action = uneAction()
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionAuthorizer = stubClass(ActionAuthorizer)
    evenementService = stubClass(EvenementService)

    deleteActionCommandHandler = new DeleteActionCommandHandler(
      actionRepository,
      actionAuthorizer,
      evenementService
    )
  })

  describe('handle', () => {
    describe("Quand l'action existe", () => {
      it("renvoie une erreur quand l'action a un commentaire", async () => {
        // Given
        const actionAvecCommentaire = uneAction({
          commentaires: [unCommentaire()]
        })
        actionRepository.get.withArgs(action.id).resolves(actionAvecCommentaire)
        const command: DeleteActionCommand = {
          idAction: actionAvecCommentaire.id
        }
        // When
        const result = await deleteActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Impossible de supprimer une action avec un commentaire.'
            )
          )
        )
      })
      it("renvoie une erreur quand l'action est terminée", async () => {
        // Given
        const actionTerminee = uneActionTerminee()
        actionRepository.get.withArgs(action.id).resolves(actionTerminee)
        const command: DeleteActionCommand = {
          idAction: actionTerminee.id
        }
        // When
        const result = await deleteActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError(
              'Impossible de supprimer une action terminée.'
            )
          )
        )
      })
      it("supprime l'action sans commentaire", async () => {
        // Given
        actionRepository.get.withArgs(action.id).resolves(action)
        const command: DeleteActionCommand = {
          idAction: action.id
        }
        // When
        const result = await deleteActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(emptySuccess())
        expect(actionRepository.delete).to.have.been.calledWith(action.id)
      })
    })
    describe("Quand l'action n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        actionRepository.get.withArgs(action.id).resolves(undefined)
        const command: DeleteActionCommand = {
          idAction: action.id
        }

        // When
        const result = await deleteActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Action', command.idAction))
        )
        expect(actionRepository.delete).not.to.have.been.calledWith(action.id)
      })
    })
  })

  describe('authorize', () => {
    it('authorise un jeune ou conseiller sur une action', async () => {
      // Given
      const command: DeleteActionCommand = {
        idAction: action.id
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await deleteActionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(actionAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idAction,
        utilisateur
      )
    })
  })

  describe('monitor', () => {
    const utilisateur = unUtilisateurJeune()

    it("créé l'événement idoine", () => {
      // When
      deleteActionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.ACTION_SUPPRIMEE,
        utilisateur
      )
    })
  })
})
