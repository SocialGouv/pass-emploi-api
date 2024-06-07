import { Evenement, EvenementService } from 'src/domain/evenement'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { RechercherMessageQueryHandler } from 'src/application/queries/rechercher-message.query.handler'
import { Chat, MessageRecherche } from 'src/domain/chat'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { ConfigService } from '@nestjs/config'

describe('RechercheMessageQueryHandler', () => {
  const sandbox = createSandbox()
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let chatRepository: StubbedType<Chat.Repository>
  let evenementService: EvenementService
  let configService: ConfigService
  let handler: RechercherMessageQueryHandler

  const messages: MessageRecherche[] = [
    {
      id: '0',
      iv: 'iv-0',
      content: 'Nous allons cueillir des champignons',
      idConversation: 'id-conversation',
      rawMessage: {
        message: 'Nous allons cueillir des champignons',
        iv: 'iv-message-0',
        idConseiller: 'id-conseiller',
        type: 'MESSAGE'
      }
    },
    {
      id: '1',
      iv: 'iv-1',
      content: 'Je vous donne rendez-vous ce mardi à 18h.',
      idConversation: 'id-conversation',
      rawMessage: {
        message: 'Je vous donne rendez-vous ce mardi à 18h.',
        iv: 'iv-message-1',
        idConseiller: 'id-conseiller',
        type: 'MESSAGE'
      }
    },
    {
      id: '2',
      iv: 'iv-2',
      content: 'Matez cette PJ de ouf.',
      idConversation: 'id-conversation',
      piecesJointes: [{ nom: 'tchoupi-fait-du-velo.jpg' }],
      rawMessage: {
        message: 'Matez cette PJ de ouf.',
        iv: 'iv-message-2',
        idConseiller: 'id-conseiller',
        type: 'MESSAGE_PJ',
        infoPieceJointe: {
          id: 'id-pj-1',
          nom: 'tchoupi-fait-du-velo.jpg'
        }
      }
    },
    {
      id: '3',
      iv: 'iv-3',
      content: 'Matez cette PJ de ouf.',
      idConversation: 'id-conversation',
      piecesJointes: [{ nom: 'rendez-vous-du-vendredi.jpg' }],
      rawMessage: {
        message: 'Matez cette PJ de ouf.',
        iv: 'iv-message-3',
        idConseiller: 'id-conseiller',
        type: 'MESSAGE_PJ',
        infoPieceJointe: {
          id: 'id-pj-2',
          nom: 'rendez-vous-du-vendredi.jpg'
        }
      }
    }
  ]

  beforeEach(async () => {
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    chatRepository = stubInterface(sandbox)
    evenementService = stubClass(EvenementService)
    configService = stubClass(ConfigService)
    handler = new RechercherMessageQueryHandler(
      chatRepository,
      conseillerAuthorizer,
      evenementService,
      configService
    )

    chatRepository.recupererMessagesConversation.resolves(messages)
  })

  describe('authorize', () => {
    it('autorise le conseiller du jeune', async () => {
      const idJeune = '1'
      await handler.authorize(
        {
          idBeneficiaire: idJeune,
          recherche: 'rendez-vous'
        },
        unUtilisateurConseiller()
      )

      expect(
        conseillerAuthorizer.autoriserConseillerPourSonJeune
      ).to.have.been.calledOnceWithExactly(idJeune, unUtilisateurConseiller())
    })
  })

  describe('handle', () => {
    it('renvoie la liste des messages', async () => {
      //Given
      const idBeneficiaire = '1'
      const recherche = 'rendez-vous'

      //When
      const result = await handler.handle({
        idBeneficiaire,
        recherche
      })

      //Then
      expect(result).to.deep.equal({
        _isSuccess: true,
        data: {
          resultats: [
            {
              id: '3',
              idConversation: 'id-conversation',
              matches: [[0, 21]],
              message: {
                idConseiller: 'id-conseiller',
                infoPieceJointe: {
                  id: 'id-pj-2',
                  nom: 'rendez-vous-du-vendredi.jpg'
                },
                iv: 'iv-message-3',
                message: 'Matez cette PJ de ouf.',
                type: 'MESSAGE_PJ'
              }
            },
            {
              id: '1',
              idConversation: 'id-conversation',
              matches: [[14, 24]],
              message: {
                idConseiller: 'id-conseiller',
                iv: 'iv-message-1',
                message: 'Je vous donne rendez-vous ce mardi à 18h.',
                type: 'MESSAGE'
              }
            }
          ]
        }
      })
    })
  })

  describe('monitor', () => {
    it('crée un AE', async () => {
      // When
      await handler.monitor(unUtilisateurConseiller())

      // Then
      expect(evenementService.creer).to.have.been.calledWith(
        Evenement.Code.RECHERCHE_MESSAGE,
        unUtilisateurConseiller()
      )
    })
  })
})
