import { expect, StubbedClass, stubClass } from 'test/utils'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { RechercherMessageQueryHandler } from 'src/application/queries/rechercher-message.query.handler'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { Chat, MessageRecherche } from 'src/domain/chat'
import { createSandbox } from 'sinon'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'

describe('RechercheMessageQueryHandler', () => {
  const sandbox = createSandbox()
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let chatRepository: StubbedType<Chat.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let handler: RechercherMessageQueryHandler

  const messages: MessageRecherche[] = [
    {
      id: '0',
      iv: 'iv-0',
      content: 'Nous allons cueillir des champignons',
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
    jeuneRepository = stubInterface(sandbox)
    handler = new RechercherMessageQueryHandler(
      chatRepository,
      jeuneRepository,
      conseillerAuthorizer
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
    it('renvoie la liste des ids de messages', async () => {
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
})
