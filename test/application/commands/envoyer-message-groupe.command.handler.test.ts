import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import {
  EnvoyerMessageGroupeCommand,
  EnvoyerMessageGroupeCommandHandler
} from '../../../src/application/commands/envoyer-message-groupe.command.handler'
import { Chat } from '../../../src/domain/chat'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { AuthorizeConseillerForJeunes } from '../../../src/application/authorizers/authorize-conseiller-for-jeunes'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import TypeMessage = Chat.TypeMessage
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Notification } from '../../../src/domain/notification/notification'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'

describe('EnvoyerMessageGroupeCommandHandler', () => {
  let envoyerMessageGroupeCommandHandler: EnvoyerMessageGroupeCommandHandler
  let authorizeConseillerForJeunes: StubbedClass<AuthorizeConseillerForJeunes>
  let evenementService: StubbedClass<EvenementService>
  let notificationService: StubbedClass<Notification.Service>
  let chatRepository: StubbedType<Chat.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>

  beforeEach(() => {
    const sandbox = createSandbox()
    chatRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    authorizeConseillerForJeunes = stubClass(AuthorizeConseillerForJeunes)
    evenementService = stubClass(EvenementService)
    notificationService = stubClass(Notification.Service)
    envoyerMessageGroupeCommandHandler = new EnvoyerMessageGroupeCommandHandler(
      chatRepository,
      jeuneRepository,
      authorizeConseillerForJeunes,
      evenementService,
      notificationService
    )
  })

  describe('handle', () => {
    describe('quand le message est sans PJ', () => {
      const jeunes = [unJeune({ id: 'jeune-1' }), unJeune({ id: 'jeune-2' })]

      beforeEach(async () => {
        // Given
        chatRepository.recupererChat
          .withArgs('jeune-1')
          .resolves({ id: 'chat-1' })
          .withArgs('jeune-2')
          .resolves({ id: 'chat-2' })

        jeuneRepository.findAllJeunesByConseiller
          .withArgs(['jeune-1', 'jeune-2'], '41')
          .resolves(jeunes)

        // When
        await envoyerMessageGroupeCommandHandler.handle({
          idsBeneficiaires: ['jeune-1', 'jeune-2'],
          message: 'un message',
          iv: '123456',
          idConseiller: '41'
        })
      })
      it('envoie un message à chaque jeune', async () => {
        // Then
        expect(chatRepository.envoyerMessageBeneficiaire).to.have.callCount(2)
        expect(
          chatRepository.envoyerMessageBeneficiaire
        ).to.have.been.calledWith('chat-1', {
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          type: TypeMessage.MESSAGE,
          infoPieceJointe: undefined
        })
        expect(
          chatRepository.envoyerMessageBeneficiaire
        ).to.have.been.calledWith('chat-2', {
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          type: TypeMessage.MESSAGE,
          infoPieceJointe: undefined
        })
      })
      it('notifie chaque jeune', async () => {
        // Then
        expect(
          notificationService.notifierLesJeunesDuNouveauMessage
        ).to.have.been.calledWithExactly(jeunes)
      })
    })
    describe('quand le message est avec PJ', () => {
      it('envoie un message avec PJ à chaque jeune', async () => {
        // Given
        chatRepository.recupererChat
          .withArgs('jeune-1')
          .resolves({ id: 'chat-1' })
          .withArgs('jeune-2')
          .resolves({ id: 'chat-2' })

        // When
        await envoyerMessageGroupeCommandHandler.handle({
          idsBeneficiaires: ['jeune-1', 'jeune-2'],
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          infoPieceJointe: {
            id: 'id',
            nom: 'nom'
          }
        })

        // Then
        expect(chatRepository.envoyerMessageBeneficiaire).to.have.callCount(2)
        expect(
          chatRepository.envoyerMessageBeneficiaire
        ).to.have.been.calledWith('chat-1', {
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          type: TypeMessage.MESSAGE_PJ,
          infoPieceJointe: {
            id: 'id',
            nom: 'nom'
          }
        })
        expect(
          chatRepository.envoyerMessageBeneficiaire
        ).to.have.been.calledWith('chat-2', {
          message: 'un message',
          iv: '123456',
          idConseiller: '41',
          type: TypeMessage.MESSAGE_PJ,
          infoPieceJointe: {
            id: 'id',
            nom: 'nom'
          }
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller à envoyer un message à ses jeunes', () => {
      // Given
      const command: EnvoyerMessageGroupeCommand = {
        idsBeneficiaires: ['jeune-1', 'jeune-2'],
        message: 'un message',
        iv: '123456',
        idConseiller: '41'
      }
      const utilisateur = unUtilisateurConseiller()

      // When
      envoyerMessageGroupeCommandHandler.authorize(command, utilisateur)

      // Then
      expect(
        authorizeConseillerForJeunes.authorize
      ).to.have.been.calledWithExactly(command.idsBeneficiaires, utilisateur)
    })
  })

  describe('monitor', () => {
    const utilisateur = unUtilisateurConseiller()

    describe("quand c'est un message sans pièce jointe", () => {
      describe('envoyé à un seul jeune', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['jeune-1'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE,
            utilisateur
          )
        })
      })
      describe('envoyé à plusieurs jeunes', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['jeune-1', 'jeune-2'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE,
            utilisateur
          )
        })
      })
    })
    describe("quand c'est un message avec pièce jointe", () => {
      describe('envoyé à un seul jeune', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_PJ', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['jeune-1'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            infoPieceJointe: {
              id: 'id',
              nom: 'nom'
            }
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_PJ,
            utilisateur
          )
        })
      })
      describe('envoyé à plusieurs jeunes', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_PJ', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['jeune-1', 'jeune-2'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            infoPieceJointe: {
              id: 'id',
              nom: 'nom'
            }
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_PJ,
            utilisateur
          )
        })
      })
    })
  })
})
