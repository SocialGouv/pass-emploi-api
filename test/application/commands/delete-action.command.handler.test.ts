import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { SinonSandbox } from 'sinon'
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
import { createSandbox, expect } from '../../utils'

describe('DeleteActionCommandHandler', () => {
  describe('execute', () => {
    let action: Action
    let actionRepository: StubbedType<Action.Repository>

    let deleteActionCommandHandler: DeleteActionCommandHandler
    beforeEach(async () => {
      action = uneAction()
      const sandbox: SinonSandbox = createSandbox()
      actionRepository = stubInterface(sandbox)
      deleteActionCommandHandler = new DeleteActionCommandHandler(
        actionRepository
      )
    })
    describe("Quand l'action existe", () => {
      it("supprime l'action", async () => {
        // Given
        actionRepository.get.withArgs(action.id).resolves(action)
        const command: DeleteActionCommand = {
          idAction: action.id
        }

        // When
        const result = await deleteActionCommandHandler.execute(command)

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
        const result = await deleteActionCommandHandler.execute(command)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Action', command.idAction))
        )
        expect(actionRepository.delete).not.to.have.been.calledWith(action.id)
      })
    })
  })
})
