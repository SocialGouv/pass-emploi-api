import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { SinonSandbox } from 'sinon'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import {
  DeleteActionCommand,
  DeleteActionCommandHandler
} from '../../../src/application/commands/delete-action.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { uneAction } from '../../fixtures/action.fixture'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('DeleteActionCommandHandler', () => {
  let action: Action
  let actionRepository: StubbedType<Action.Repository>
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let deleteActionCommandHandler: DeleteActionCommandHandler

  beforeEach(async () => {
    action = uneAction()
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionAuthorizer = stubClass(ActionAuthorizer)

    deleteActionCommandHandler = new DeleteActionCommandHandler(
      actionRepository,
      actionAuthorizer
    )
  })

  describe('handle', () => {
    describe("Quand l'action existe", () => {
      it("supprime l'action", async () => {
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

      const utilisateur = unUtilisateurConseiller()

      // When
      await deleteActionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(actionAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idAction,
        utilisateur
      )
    })
  })
})
