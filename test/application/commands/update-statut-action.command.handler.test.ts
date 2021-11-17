import {
  UpdateStatutActionCommand,
  UpdateStatutActionCommandHandler
} from '../../../src/application/commands/update-statut-action.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { uneAction } from '../../fixtures/action.fixture'
import { ActionFakeRepository } from '../../infrastructure/repositories/fakes/action-fake.repository'
import { expect } from '../../utils'
import Statut = Action.Statut

describe('UpdateStatutActionCommandHandler', () => {
  let actionRepository: Action.Repository
  let updateStatutActionCommandHandler: UpdateStatutActionCommandHandler

  before(() => {
    actionRepository = new ActionFakeRepository()
    updateStatutActionCommandHandler = new UpdateStatutActionCommandHandler(
      actionRepository
    )
  })

  describe('execute', () => {
    it("modifie le statut de l'action", async () => {
      // Given
      const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
      const actionPasCommencee = uneAction({
        id: idAction,
        statut: Statut.PAS_COMMENCEE
      })
      await actionRepository.save(actionPasCommencee)

      // When
      const command: UpdateStatutActionCommand = {
        idAction: idAction,
        statut: Action.Statut.EN_COURS
      }
      const result = await updateStatutActionCommandHandler.execute(command)

      // Then
      const actionModifiee = uneAction({
        id: idAction,
        statut: Action.Statut.EN_COURS
      })
      expect(await actionRepository.get(idAction)).to.deep.equal(actionModifiee)
      expect(result).to.deep.equal(emptySuccess())
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const idAction = 'id-action-inexistante'

        // When
        const result = await updateStatutActionCommandHandler.execute({
          idAction
        })

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Action', idAction))
        )
      })
    })
  })
})
