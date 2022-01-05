import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  GetChatSecretsQuery,
  GetChatSecretsQueryHandler
} from 'src/application/queries/get-chat-secrets.query.handler'
import { Authentification } from 'src/domain/authentification'
import { Chat } from 'src/domain/chat'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'

describe('GetChatSecretsQueryHandler', () => {
  let chatRepository: StubbedType<Chat.Repository>
  let getChatSecretsQueryHandler: GetChatSecretsQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    chatRepository = stubInterface(sandbox)

    getChatSecretsQueryHandler = new GetChatSecretsQueryHandler(chatRepository)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('retourne les secrets du chat', async () => {
      // Given
      const utilisateur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      const getChatSecretsQuery: GetChatSecretsQuery = {
        utilisateur
      }

      const mockedChatSecrets = {}
      chatRepository.getChatSecretsQueryModel
        .withArgs(utilisateur)
        .resolves(mockedChatSecrets)

      // When
      const actual = await getChatSecretsQueryHandler.handle(
        getChatSecretsQuery
      )

      // Then
      expect(actual).to.deep.equal(mockedChatSecrets)
    })
  })
})
