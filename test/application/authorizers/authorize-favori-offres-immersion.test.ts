import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { FavoriOffresImmersionAuthorizer } from '../../../src/application/authorizers/authorize-favori-offres-immersion'
import { Unauthorized } from '../../../src/domain/erreur'
import { OffresImmersion } from '../../../src/domain/offre-immersion'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { createSandbox, expect } from '../../utils'

describe('FavoriOffresImmersionAuthorizer', () => {
  let offresImmersionRepository: StubbedType<OffresImmersion.Repository>
  let favoriOffresImmersionAuthorizer: FavoriOffresImmersionAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    favoriOffresImmersionAuthorizer = new FavoriOffresImmersionAuthorizer(
      offresImmersionRepository
    )
  })

  describe('authorize', () => {
    describe('quand le favori existe et est lié au jeune', () => {
      it("valide l'autorisation", async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const offreImmersion = uneOffreImmersion()

        offresImmersionRepository.getFavori
          .withArgs(utilisateur.id, offreImmersion.id)
          .resolves(offreImmersion)

        // When
        const result = await favoriOffresImmersionAuthorizer.authorize(
          utilisateur.id,
          offreImmersion.id,
          utilisateur
        )

        // Then
        expect(result).to.be.equal(undefined)
      })
    })
    describe("quand le jeune n'a pas ce favori", () => {
      it('retourne une erreur', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const offreImmersion = uneOffreImmersion()

        offresImmersionRepository.getFavori
          .withArgs(utilisateur.id, 'une-offre')
          .resolves(undefined)

        // When
        const call = favoriOffresImmersionAuthorizer.authorize(
          utilisateur.id,
          offreImmersion.id,
          utilisateur
        )

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
