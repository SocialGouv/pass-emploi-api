import { SinonSandbox } from 'sinon'
import {
  GetChatSecretsQuery,
  GetChatSecretsQueryHandler
} from 'src/application/queries/get-chat-secrets.query.handler'
import { Authentification } from 'src/domain/authentification'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'
import { testConfig } from '../../utils/module-for-testing'

describe('GetChatSecretsQueryHandler', () => {
  let firebaseClient: StubbedClass<FirebaseClient>
  let getChatSecretsQueryHandler: GetChatSecretsQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    firebaseClient = stubClass(FirebaseClient)

    getChatSecretsQueryHandler = new GetChatSecretsQueryHandler(
      firebaseClient,
      testConfig()
    )
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

      firebaseClient.getToken.withArgs(utilisateur).resolves('un-token')

      // When
      const actual = await getChatSecretsQueryHandler.handle(
        getChatSecretsQuery
      )

      // Then
      expect(actual).to.deep.equal({
        cle: 'firebase-encryption-key',
        token: 'un-token'
      })
    })
  })
})
