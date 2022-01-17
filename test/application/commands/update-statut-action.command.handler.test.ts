import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { EvenementService } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
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
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('UpdateStatutActionCommandHandler', () => {
  let actionRepository: StubbedType<Action.Repository>
  let updateStatutActionCommandHandler: UpdateStatutActionCommandHandler
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let evenementService: StubbedClass<EvenementService>
  let dateService: StubbedClass<DateService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionAuthorizer = stubClass(ActionAuthorizer)
    evenementService = stubClass(EvenementService)
    dateService = stubClass(DateService)
    updateStatutActionCommandHandler = new UpdateStatutActionCommandHandler(
      actionRepository,
      actionAuthorizer,
      evenementService,
      dateService
    )
  })

  describe('handle', () => {
    it("modifie le statut de l'action", async () => {
      // Given
      const idAction = '35399853-f224-4910-8d02-44fb1ac85606'
      const actionPasCommencee = uneAction({
        id: idAction,
        statut: Action.Statut.PAS_COMMENCEE
      })
      actionRepository.get.withArgs(idAction).resolves(actionPasCommencee)

      // When
      const command: UpdateStatutActionCommand = {
        idAction: idAction,
        statut: Action.Statut.EN_COURS
      }
      const result = await updateStatutActionCommandHandler.handle(command)

      // Then
      const actionModifiee = uneAction({
        id: idAction,
        statut: Action.Statut.EN_COURS
      })
      expect(actionRepository.save).to.have.been.calledWithExactly(
        actionModifiee
      )
      expect(result).to.deep.equal(emptySuccess())
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie une failure', async () => {
        // Given
        const idAction = 'id-action-inexistante'
        actionRepository.get.withArgs(idAction).resolves(undefined)

        // When
        const result = await updateStatutActionCommandHandler.handle({
          idAction
        })

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Action', idAction))
        )
      })
    })
  })

  describe('authorize', () => {
    it('authorise un jeune ou conseiller à modifier une action', async () => {
      // Given
      const command: UpdateStatutActionCommand = {
        idAction: 'idAction',
        statut: Action.Statut.EN_COURS
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await updateStatutActionCommandHandler.authorize(command, utilisateur)

      // Then
      expect(actionAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idAction,
        utilisateur
      )
    })
  })
})
