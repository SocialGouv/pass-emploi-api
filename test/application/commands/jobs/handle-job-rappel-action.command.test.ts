import {
  HandleJobRappelActionCommand,
  HandleJobRappelActionCommandHandler
} from '../../../../src/application/commands/jobs/handle-job-rappel-action.command'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from '../../../../src/domain/jeune'
import { Notification } from '../../../../src/domain/notification'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { createSandbox } from 'sinon'
import { Planificateur } from '../../../../src/domain/planificateur'
import { Action } from '../../../../src/domain/action'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { uneAction } from '../../../fixtures/action.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { success } from '../../../../src/building-blocks/types/result'

describe('HandleJobRappelActionCommandHandler', () => {
  let handleJobRappelActionCommandHandler: HandleJobRappelActionCommandHandler
  let actionRepository: StubbedType<Action.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let notificationRepository: StubbedType<Notification.Repository>
  let actionFactory: StubbedClass<Action.Factory>

  beforeEach(() => {
    const sandbox = createSandbox()
    actionRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    actionFactory = stubClass(Action.Factory)
    handleJobRappelActionCommandHandler =
      new HandleJobRappelActionCommandHandler(
        actionRepository,
        jeuneRepository,
        notificationRepository,
        actionFactory
      )
  })

  describe('handle', () => {
    const action = uneAction()
    const command: HandleJobRappelActionCommand = {
      job: {
        type: Planificateur.JobEnum.RAPPEL_ACTION,
        date: uneDatetime.toJSDate(),
        contenu: {
          idAction: action.id
        }
      }
    }

    describe('quand il faut envoyer un rappel', () => {
      describe('quand le jeune a un push token', () => {
        it('envoie un rappel', async () => {
          // Given
          actionRepository.get.withArgs(action.id).resolves(action)
          actionFactory.doitEnvoyerUneNotificationDeRappel
            .withArgs(action)
            .returns(true)
          jeuneRepository.get.withArgs(action.idJeune).resolves(unJeune())

          // When
          const result = await handleJobRappelActionCommandHandler.handle(
            command
          )

          // Then
          expect(result).to.deep.equal(
            success({
              idAction: action.id,
              idJeune: action.idJeune,
              notificationEnvoyee: true
            })
          )
          expect(notificationRepository.send).to.have.been.calledWithExactly({
            token: unJeune().pushNotificationToken,
            notification: {
              title: 'Rappel action',
              body: 'Une action arrive à écheance dans 3 jours'
            },
            data: {
              type: 'DETAIL_ACTION',
              id: action.id
            }
          })
        })
      })
      describe("quand le jeune n'a pas de push token", () => {
        it("n'envoie pas de rappel", async () => {
          // Given
          actionRepository.get.withArgs(action.id).resolves(action)
          actionFactory.doitEnvoyerUneNotificationDeRappel
            .withArgs(action)
            .returns(true)
          jeuneRepository.get.withArgs(action.idJeune).resolves(
            unJeune({
              pushNotificationToken: undefined
            })
          )

          // When
          const result = await handleJobRappelActionCommandHandler.handle(
            command
          )

          // Then
          expect(result).to.deep.equal(
            success({
              idAction: action.id,
              idJeune: action.idJeune,
              notificationEnvoyee: false
            })
          )
          expect(notificationRepository.send).not.to.have.been.called()
        })
      })
    })
    describe('quand il ne faut pas envoyer de rappel', () => {
      it("n'envoie pas de rappel", async () => {
        // Given
        actionRepository.get.withArgs(action.id).resolves(action)
        actionFactory.doitEnvoyerUneNotificationDeRappel
          .withArgs(action)
          .returns(false)

        // When
        const result = await handleJobRappelActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          success({
            notificationEnvoyee: false
          })
        )
        expect(notificationRepository.send).not.to.have.been.called()
      })
    })

    describe("quand l'action n'existe pas", () => {
      it("n'envoie pas de rappel", async () => {
        // Given
        actionRepository.get.withArgs(action.id).resolves(undefined)

        // When
        const result = await handleJobRappelActionCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          success({
            notificationEnvoyee: false
          })
        )
        expect(notificationRepository.send).not.to.have.been.called()
      })
    })
  })
})
