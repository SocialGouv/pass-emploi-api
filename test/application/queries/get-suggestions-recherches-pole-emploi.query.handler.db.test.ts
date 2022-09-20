import { expect, StubbedClass, stubClass } from '../../utils'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { GetSuggestionsRecherchesPoleEmploiQueryHandler } from '../../../src/application/queries/get-suggestions-recherches-pole-emploi.quey.handler.db'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { Core } from '../../../src/domain/core'

describe('GetSuggestionsRecherchesPoleEmploiQueryHandler', () => {
  let getSuggestionsRecherchesPoleEmploiQueryHandler: GetSuggestionsRecherchesPoleEmploiQueryHandler
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>

  beforeEach(() => {
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)
    getSuggestionsRecherchesPoleEmploiQueryHandler =
      new GetSuggestionsRecherchesPoleEmploiQueryHandler(
        jeunePoleEmploiAuthorizer
      )
  })

  describe('authorize', () => {
    it('autorise le jeune Pôle Emploi', async () => {
      // Given
      const idJeune = 'id-jeune'

      const query = { idJeune }
      const utilisateur = unUtilisateurJeune({
        id: idJeune,
        structure: Core.Structure.POLE_EMPLOI
      })

      // When
      await getSuggestionsRecherchesPoleEmploiQueryHandler.authorize(
        query,
        utilisateur
      )

      // Then
      expect(
        jeunePoleEmploiAuthorizer.authorize
      ).to.have.been.calledWithExactly(idJeune, utilisateur)
    })
  })
})
