import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetTokenPoleEmploiQueryHandler } from '../../../src/application/queries/get-token-pole-emploi.query.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { estPoleEmploi } from '../../../src/domain/core'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('GetTokenPoleEmploiQueryHandler', () => {
  let getTokenPoleEmploiQueryHandler: GetTokenPoleEmploiQueryHandler
  let oidcClient: StubbedClass<OidcClient>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  const query = {
    idJeune: 'un-id-jeune',
    accessToken: 'bearer coucou'
  }

  beforeEach(async () => {
    oidcClient = stubClass(OidcClient)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getTokenPoleEmploiQueryHandler = new GetTokenPoleEmploiQueryHandler(
      oidcClient,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    const utilisateur = unUtilisateurJeune()
    it('récupère et renvoie le token du bénéficiaire', async () => {
      // Given

      oidcClient.exchangeTokenJeune
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
          estPoleEmploi(utilisateur.structure)
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
