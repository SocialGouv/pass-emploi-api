import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../../src/application/commands/create-action.command.handler'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { Jeune } from '../../../src/domain/jeune'
import { Notification } from '../../../src/domain/notification'
import { uneAction } from '../../fixtures/action.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { ActionFakeRepository } from '../../infrastructure/repositories/fakes/action-fake.repository'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('CreateActionCommandHandler', () => {
  describe('execute', () => {
    let action: Action
    let jeune: Required<Omit<Jeune, 'tokenLastUpdate'>>
    let actionRepository: Action.Repository
    let notificationRepository: StubbedType<Notification.Repository>
    let actionFactory: StubbedClass<Action.Factory>
    let createActionCommandHandler: CreateActionCommandHandler
    before(async () => {
      action = uneAction()
      jeune = unJeune()
      const sandbox: SinonSandbox = createSandbox()
      actionRepository = new ActionFakeRepository()
      const jeuneRepository: StubbedType<Jeune.Repository> =
        stubInterface(sandbox)
      notificationRepository = stubInterface(sandbox)
      jeuneRepository.get.withArgs(action.idJeune).resolves(jeune)
      actionFactory = stubClass(Action.Factory)
      createActionCommandHandler = new CreateActionCommandHandler(
        actionRepository,
        jeuneRepository,
        notificationRepository,
        actionFactory
      )
    })

    it('créée une action', async () => {
      // Given
      actionFactory.buildAction.returns(success(action))
      const command: CreateActionCommand = {
        idJeune: action.idJeune,
        contenu: action.contenu,
        idCreateur: action.idCreateur,
        typeCreateur: action.typeCreateur,
        statut: action.statut,
        commentaire: action.commentaire
      }

      // When
      const result = await createActionCommandHandler.execute(command)

      // Then
      expect(result).to.deep.equal(success(action.id))
      expect(await actionRepository.get(action.id)).to.deep.equal(action)
      expect(notificationRepository.send).to.have.been.calledWith(
        Notification.createNouvelleAction(
          jeune.pushNotificationToken,
          action.id
        )
      )
    })

    describe('quand le statut est incorrect', () => {
      it('remonte la failure', async () => {
        // Given
        const statutIncorrect = 'STATUT_INCORRECT'
        const echec = failure(new Action.StatutInvalide(statutIncorrect))
        actionFactory.buildAction.returns(echec)
        const command: CreateActionCommand = {
          idJeune: action.idJeune,
          contenu: action.contenu,
          idCreateur: action.idCreateur,
          typeCreateur: action.typeCreateur,
          statut: statutIncorrect as Action.Statut,
          commentaire: action.commentaire
        }

        // When
        const result = await createActionCommandHandler.execute(command)

        // Then
        expect(result).to.deep.equal(echec)
      })
    })
  })
})
