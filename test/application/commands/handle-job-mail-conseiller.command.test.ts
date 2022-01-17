import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { Planificateur } from '../../../src/domain/planificateur'

import {
  HandleJobMailConseillerCommand,
  HandleJobMailConseillerCommandHandler
} from '../../../src/application/commands/handle-job-mail-conseiller.command'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { createSandbox, expect } from '../../utils'
import { emptySuccess } from '../../../src/building-blocks/types/result'

describe('HandleJobMailConseillerCommandHandler', () => {
  let handleJobMailConseillerCommandHandler: HandleJobMailConseillerCommandHandler
  let chatRepository: StubbedType<Chat.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    chatRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)

    handleJobMailConseillerCommandHandler =
      new HandleJobMailConseillerCommandHandler(
        chatRepository,
        conseillerRepository
      )
  })

  describe('quand le conseiller n"a aucun message non lu', () => {
    it('renvoie un succès', async () => {
      // Given
      const command: HandleJobMailConseillerCommand = {
        job: {
          type: Planificateur.JobEnum.MAIL_CONSEILLER,
          contenu: {
            idConseiller: '1'
          },
          date: DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC().toJSDate()
        }
      }
      chatRepository.getNombreDeConversationsNonLues
        .withArgs(command.job.contenu.idConseiller)
        .resolves(0)

      // When
      const result = await handleJobMailConseillerCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(emptySuccess())
      expect(conseillerRepository.envoyerUnRappelParMail).to.have.callCount(0)
    })
  })
  describe('quand le conseiller a des messages non lus', () => {
    it('envoie un rappel par mail', async () => {
      // Given
      const command: HandleJobMailConseillerCommand = {
        job: {
          type: Planificateur.JobEnum.MAIL_CONSEILLER,
          contenu: {
            idConseiller: '1'
          },
          date: DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC().toJSDate()
        }
      }
      chatRepository.getNombreDeConversationsNonLues
        .withArgs(command.job.contenu.idConseiller)
        .resolves(1)

      // When
      await handleJobMailConseillerCommandHandler.handle(command)

      // Then
      expect(conseillerRepository.envoyerUnRappelParMail).to.have.callCount(1)
    })
  })
})
