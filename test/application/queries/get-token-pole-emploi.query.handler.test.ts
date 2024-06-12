import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetTokenPoleEmploiQueryHandler } from '../../../src/application/queries/get-token-pole-emploi.query.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { estPoleEmploiBRSA } from '../../../src/domain/core'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client.db'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('GetTokenPoleEmploiQueryHandler', () => {
  let getTokenPoleEmploiQueryHandler: GetTokenPoleEmploiQueryHandler
  let keycloakClient: StubbedClass<KeycloakClient>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  const query = {
    idJeune: 'un-id-jeune',
    accessToken: 'bearer coucou'
  }

  beforeEach(async () => {
    keycloakClient = stubClass(KeycloakClient)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getTokenPoleEmploiQueryHandler = new GetTokenPoleEmploiQueryHandler(
      keycloakClient,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    const utilisateur = unUtilisateurJeune()
    it('récupère et renvoie le token du bénéficiaire', async () => {
      // Given

      keycloakClient.exchangeTokenJeune
        .withArgs(query.accessToken, utilisateur.structure)
        .resolves('idpToken')

      // When
      const result = await getTokenPoleEmploiQueryHandler.handle(
        query,
        utilisateur
      )

      // Then
      expect(result._isSuccess && result.data).to.deep.equal('idpToken')
    })
  })

  describe('authorize', () => {
    it('autorise un bénéficiaire Pôle Emploi', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      jeuneAuthorizer.autoriserLeJeune
        .withArgs(
          query.idJeune,
          utilisateur,
          estPoleEmploiBRSA(utilisateur.structure)
        )
        .resolves(emptySuccess())

      // When
      const result = await getTokenPoleEmploiQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(result._isSuccess).to.be.true()
    })
  })
})
