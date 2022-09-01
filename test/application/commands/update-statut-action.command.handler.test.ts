import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { ActionAuthorizer } from '../../../src/application/authorizers/authorize-action'
import {
  UpdateStatutActionCommand,
  UpdateStatutActionCommandHandler
} from '../../../src/application/commands/update-statut-action.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action/action'
import { uneAction } from '../../fixtures/action.fixture'
import {
  unUtilisateurDecode,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('UpdateStatutActionCommandHandler', () => {
  let actionRepository: StubbedType<Action.Repository>
  let updateStatutActionCommandHandler: UpdateStatutActionCommandHandler
  let actionFactory: StubbedClass<Action.Factory>
  let actionAuthorizer: StubbedClass<ActionAuthorizer>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    actionFactory = stubClass(Action.Factory)
    actionAuthorizer = stubClass(ActionAuthorizer)
    evenementService = stubClass(EvenementService)
    updateStatutActionCommandHandler = new UpdateStatutActionCommandHandler(
      actionRepository,
      actionFactory,
      actionAuthorizer,
      evenementService
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
      const actionModifiee = uneAction({
        id: idAction,
        statut: Action.Statut.EN_COURS
      })
      actionRepository.get.withArgs(idAction).resolves(actionPasCommencee)
      actionFactory.updateStatut.returns(success(actionModifiee))

      // When
      const command: UpdateStatutActionCommand = {
        idAction: idAction,
        statut: Action.Statut.EN_COURS
      }
      const result = await updateStatutActionCommandHandler.handle(command)

      // Then
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
          idAction,
          statut: Action.Statut.PAS_COMMENCEE
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

  describe('monitor', () => {
    it('monitore la modification de la démarche', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      // When
      await updateStatutActionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWithExactly(
        Evenement.Type.ACTION_STATUT_MODIFIE,
        utilisateur
      )
    })
  })
})
