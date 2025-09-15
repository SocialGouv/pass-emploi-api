import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import {
  EnvoyerMessageGroupeCommand,
  EnvoyerMessageGroupeCommandHandler
} from '../../../src/application/commands/envoyer-message-groupe.command.handler'
import { Chat } from '../../../src/domain/chat'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Notification } from '../../../src/domain/notification/notification'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unJeune } from '../../fixtures/jeune.fixture'
import { Conseiller } from '../../../src/domain/conseiller'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { ListeDeDiffusionAuthorizer } from '../../../src/application/authorizers/liste-de-diffusion-authorizer'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'

describe('EnvoyerMessageGroupeCommandHandler', () => {
  let envoyerMessageGroupeCommandHandler: EnvoyerMessageGroupeCommandHandler
  let authorizeConseillerForJeunes: StubbedClass<ConseillerAuthorizer>
  let authorizeListeDeDiffusion: StubbedClass<ListeDeDiffusionAuthorizer>
  let evenementService: StubbedClass<EvenementService>
  let notificationService: StubbedClass<Notification.Service>
  let chatRepository: StubbedType<Chat.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let listeDeDiffusionRepository: StubbedType<Conseiller.ListeDeDiffusion.Repository>

  beforeEach(() => {
    const sandbox = createSandbox()
    chatRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    listeDeDiffusionRepository = stubInterface(sandbox)
    authorizeConseillerForJeunes = stubClass(ConseillerAuthorizer)
    authorizeListeDeDiffusion = stubClass(ListeDeDiffusionAuthorizer)
    evenementService = stubClass(EvenementService)
    notificationService = stubClass(Notification.Service)
    envoyerMessageGroupeCommandHandler = new EnvoyerMessageGroupeCommandHandler(
      chatRepository,
      jeuneRepository,
      listeDeDiffusionRepository,
      authorizeConseillerForJeunes,
      authorizeListeDeDiffusion,
      evenementService,
      notificationService
    )
  })

  describe('handle', () => {
    describe('quand on envoie un message à des bénéficiaires', () => {
      describe('quand le message est sans PJ', () => {
        const jeunes = [unJeune({ id: 'jeune-1' }), unJeune({ id: 'jeune-2' })]

        beforeEach(async () => {
          // Given
          chatRepository.recupererConversationIndividuelle
            .withArgs('jeune-1')
            .resolves({ id: 'chat-1', idBeneficiaire: 'jeune-1' })
            .withArgs('jeune-2')
            .resolves({ id: 'chat-2', idBeneficiaire: 'jeune-2' })

          jeuneRepository.findAll
            .withArgs(['jeune-1', 'jeune-2'])
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
          expect(chatRepository.envoyerMessageIndividuel).to.have.callCount(2)
          expect(
            chatRepository.envoyerMessageIndividuel
          ).to.have.been.calledWith('chat-1', {
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            type: 'MESSAGE',
            infoPieceJointe: undefined
          })
          expect(
            chatRepository.envoyerMessageIndividuel
          ).to.have.been.calledWith('chat-2', {
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            type: 'MESSAGE',
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
          chatRepository.recupererConversationIndividuelle
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
          expect(chatRepository.envoyerMessageIndividuel).to.have.callCount(2)
          expect(
            chatRepository.envoyerMessageIndividuel
          ).to.have.been.calledWith('chat-1', {
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            type: 'MESSAGE_PJ',
            infoPieceJointe: {
              id: 'id',
              nom: 'nom'
            }
          })
          expect(
            chatRepository.envoyerMessageIndividuel
          ).to.have.been.calledWith('chat-2', {
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            type: 'MESSAGE_PJ',
            infoPieceJointe: {
              id: 'id',
              nom: 'nom'
            }
          })
        })
      })
    })
    describe('quand on envoie un message à des listes de diffusion', () => {
      const listeDeDiffusionUno = uneListeDeDiffusion({
        id: 'liste-1',
        beneficiaires: [
          {
            id: 'jeune-1',
            dateAjout: uneDatetime(),
            estDansLePortefeuille: true
          }
        ]
      })
      const listeDeDiffusionDos = uneListeDeDiffusion({
        id: 'liste-2',
        beneficiaires: [
          {
            id: 'jeune-2',
            dateAjout: uneDatetime(),
            estDansLePortefeuille: true
          }
        ]
      })

      describe('quand le message est sans PJ', () => {
        const jeunes = [unJeune({ id: 'jeune-1' }), unJeune({ id: 'jeune-2' })]

        beforeEach(async () => {
          // Given
          listeDeDiffusionRepository.findAll
            .withArgs(['liste-1', 'liste-2'])
            .resolves([listeDeDiffusionUno, listeDeDiffusionDos])

          chatRepository.recupererConversationIndividuelle
            .withArgs('jeune-1')
            .resolves({ id: 'chat-1', idBeneficiaire: 'jeune-1' })
            .withArgs('jeune-2')
            .resolves({ id: 'chat-2', idBeneficiaire: 'jeune-2' })

          chatRepository.recupererConversationGroupe
            .withArgs('liste-1')
            .resolves({ id: 'groupe-1' })
            .withArgs('liste-2')
            .resolves({ id: 'groupe-2' })

          jeuneRepository.findAll
            .withArgs(['jeune-1', 'jeune-2'])
            .resolves(jeunes)

          // When
          await envoyerMessageGroupeCommandHandler.handle({
            idsListesDeDiffusion: ['liste-1', 'liste-2'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          })
        })
        it('envoie un message à chaque jeune', async () => {
          // Then
          expect(chatRepository.envoyerMessageIndividuel).to.have.callCount(2)
          expect(
            chatRepository.envoyerMessageIndividuel
          ).to.have.been.calledWith('chat-1', {
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            type: 'MESSAGE',
            infoPieceJointe: undefined
          })
          expect(
            chatRepository.envoyerMessageIndividuel
          ).to.have.been.calledWith('chat-2', {
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            type: 'MESSAGE',
            infoPieceJointe: undefined
          })
        })
        it('notifie chaque jeune', async () => {
          // Then
          expect(
            notificationService.notifierLesJeunesDuNouveauMessage
          ).to.have.been.calledWithExactly(jeunes)
        })
        it('envoie un message à chaque groupe', () => {
          // Then
          expect(chatRepository.envoyerMessageGroupe).to.have.been.calledWith(
            'groupe-1',
            {
              message: 'un message',
              iv: '123456',
              idConseiller: '41',
              type: 'MESSAGE',
              infoPieceJointe: undefined,
              idsBeneficiaires: ['jeune-1']
            }
          )
          expect(chatRepository.envoyerMessageGroupe).to.have.been.calledWith(
            'groupe-2',
            {
              message: 'un message',
              iv: '123456',
              idConseiller: '41',
              type: 'MESSAGE',
              infoPieceJointe: undefined,
              idsBeneficiaires: ['jeune-2']
            }
          )
        })
      })
    })
    describe('quand on envoie un message à un jeune via la liste et son id', () => {
      const listeDeDiffusionUno = uneListeDeDiffusion({
        id: 'liste-1',
        beneficiaires: [
          {
            id: 'jeune-1',
            dateAjout: uneDatetime(),
            estDansLePortefeuille: true
          }
        ]
      })

      describe('quand le message est sans PJ', () => {
        const jeunes = [unJeune({ id: 'jeune-1' })]

        beforeEach(async () => {
          // Given
          listeDeDiffusionRepository.findAll
            .withArgs(['liste-1'])
            .resolves([listeDeDiffusionUno])

          chatRepository.recupererConversationIndividuelle
            .withArgs('jeune-1')
            .resolves({ id: 'chat-1', idBeneficiaire: 'jeune-1' })

          jeuneRepository.findAll.withArgs(['jeune-1']).resolves(jeunes)

          // When
          await envoyerMessageGroupeCommandHandler.handle({
            idsListesDeDiffusion: ['liste-1'],
            idsBeneficiaires: ['jeune-1'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          })
        })
        it('envoie un message une seule fois au jeune', async () => {
          // Then
          expect(chatRepository.envoyerMessageIndividuel).to.have.callCount(1)
          expect(
            chatRepository.envoyerMessageIndividuel
          ).to.have.been.calledWith('chat-1', {
            message: 'un message',
            iv: '123456',
            idConseiller: '41',
            type: 'MESSAGE',
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
    })
    describe("quand on veut envoyer un message à un jeune qui n'est pas dans le portefeuille", () => {
      const listeDeDiffusionUno = uneListeDeDiffusion({
        id: 'liste-1',
        beneficiaires: [
          {
            id: 'jeune-1',
            dateAjout: uneDatetime(),
            estDansLePortefeuille: false
          }
        ]
      })

      beforeEach(async () => {
        // Given
        listeDeDiffusionRepository.findAll
          .withArgs(['liste-1'])
          .resolves([listeDeDiffusionUno])

        chatRepository.recupererConversationIndividuelle
          .withArgs('jeune-1')
          .resolves({ id: 'chat-1', idBeneficiaire: 'jeune-1' })

        jeuneRepository.findAll.withArgs([]).resolves([])

        // When
        await envoyerMessageGroupeCommandHandler.handle({
          idsListesDeDiffusion: ['liste-1'],
          message: 'un message',
          iv: '123456',
          idConseiller: '41'
        })
      })
      it("n'envoie pas de message", async () => {
        // Then
        expect(chatRepository.envoyerMessageIndividuel).to.have.callCount(0)
      })
      it('ne notifie pas le jeune', async () => {
        // Then
        expect(
          notificationService.notifierLesJeunesDuNouveauMessage
        ).to.have.been.calledWithExactly([])
      })
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller à envoyer un message à ses jeunes', async () => {
      // Given
      const command: EnvoyerMessageGroupeCommand = {
        idsBeneficiaires: ['jeune-1', 'jeune-2'],
        message: 'un message',
        iv: '123456',
        idConseiller: '41'
      }
      const utilisateur = unUtilisateurConseiller()
      authorizeConseillerForJeunes.autoriserConseillerPourSesJeunes
        .withArgs(['jeune-1', 'jeune-2'], utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await envoyerMessageGroupeCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(result).to.be.deep.equal(emptySuccess())
    })
    it('autorise un conseiller à envoyer un message à ses listes de diffusion', async () => {
      // Given
      const command: EnvoyerMessageGroupeCommand = {
        idsListesDeDiffusion: ['liste-1'],
        message: 'un message',
        iv: '123456',
        idConseiller: '41'
      }
      const utilisateur = unUtilisateurConseiller()
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('liste-1', utilisateur)
        .resolves(emptySuccess())

      // When
      const result = await envoyerMessageGroupeCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(result).to.be.deep.equal(emptySuccess())
    })

    it("rejette si une des listes n'est pas au conseiller", async () => {
      // Given
      const command: EnvoyerMessageGroupeCommand = {
        idsListesDeDiffusion: ['liste-1', 'liste-2'],
        message: 'un message',
        iv: '123456',
        idConseiller: '41'
      }
      const utilisateur = unUtilisateurConseiller()
      authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion
        .withArgs('liste-1', utilisateur)
        .resolves(emptySuccess())
        .withArgs('liste-2', utilisateur)
        .resolves(failure(new DroitsInsuffisants()))

      // When
      const result = await envoyerMessageGroupeCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(result).to.be.deep.equal(failure(new DroitsInsuffisants()))
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
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_MANUEL', async () => {
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
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL,
            utilisateur
          )
        })
      })

      describe('envoyé à une ou plusieurs listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_LISTE', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsListesDeDiffusion: ['liste-1'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_LISTE,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_MIXTE', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['jeune-1'],
            idsListesDeDiffusion: ['liste-1'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MIXTE,
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
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ', async () => {
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
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ,
            utilisateur
          )
        })
      })

      describe('envoyé à une ou plusieurs listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsListesDeDiffusion: ['liste-1'],
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
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_MIXTE_PJ', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['jeune-1'],
            idsListesDeDiffusion: ['liste-1'],
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
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MIXTE_PJ,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_MIXTE', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['jeune-1'],
            idsListesDeDiffusion: ['liste-1'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MIXTE,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: [],
            idsListesDeDiffusion: ['liste-1'],
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
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_LISTE', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: [],
            idsListesDeDiffusion: ['liste-1'],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_LISTE,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['id-jeune-1', 'id-jeune-2'],
            idsListesDeDiffusion: [],
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
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_MULTIPLE_MANUEL', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['id-jeune-1', 'id-jeune-2'],
            idsListesDeDiffusion: [],
            message: 'un message',
            iv: '123456',
            idConseiller: '41'
          }

          // When
          await envoyerMessageGroupeCommandHandler.monitor(utilisateur, command)

          // Then
          expect(evenementService.creer).to.have.been.calledWithExactly(
            Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL,
            utilisateur
          )
        })
      })

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE_PJ', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['id-jeune-1'],
            idsListesDeDiffusion: [],
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

      describe('envoyé à bénéficiaires et listes de diffusion', () => {
        it('sauvegarde un événement MESSAGE_ENVOYE', async () => {
          // Given
          const command: EnvoyerMessageGroupeCommand = {
            idsBeneficiaires: ['id-jeune-1'],
            idsListesDeDiffusion: [],
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
    })
  })
})
