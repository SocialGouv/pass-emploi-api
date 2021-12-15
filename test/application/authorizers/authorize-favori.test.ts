import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { FavoriAuthorizer } from '../../../src/application/authorizers/authorize-favori'
import { Unauthorized } from '../../../src/domain/erreur'
import { OffresEmploi } from '../../../src/domain/offre-emploi'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { createSandbox, expect } from '../../utils'

describe('FavoriAuthorizer', () => {
  let offresEmploiRepository: StubbedType<OffresEmploi.Repository>
  let favoriAuthorizer: FavoriAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    offresEmploiRepository = stubInterface(sandbox)
    favoriAuthorizer = new FavoriAuthorizer(offresEmploiRepository)
  })

  describe('authorize', () => {
    describe('quand le favori existe et est lié au jeune', () => {
      it("valide l'autorisation", async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const offreEmploi = uneOffreEmploi()

        offresEmploiRepository.getFavori
          .withArgs(utilisateur.id, offreEmploi.id)
          .resolves(offreEmploi)

        // When
        const result = await favoriAuthorizer.authorize(
          utilisateur.id,
          offreEmploi.id,
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
        const offreEmploi = uneOffreEmploi()

        offresEmploiRepository.getFavori
          .withArgs(utilisateur.id, 'une-offre')
          .resolves(undefined)

        // When
        const call = favoriAuthorizer.authorize(
          utilisateur.id,
          offreEmploi.id,
          utilisateur
        )

        // Then
        expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
