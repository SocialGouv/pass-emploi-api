import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { FavoriOffresEmploiAuthorizer } from '../../../src/application/authorizers/authorize-favori-offres-emploi'
import { Unauthorized } from '../../../src/domain/erreur'
import { OffresEmploi } from '../../../src/domain/offre-emploi'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { createSandbox, expect } from '../../utils'

describe('FavoriOffresEmploiAuthorizer', () => {
  let offresEmploiRepository: StubbedType<OffresEmploi.Repository>
  let favoriOffresEmploiAuthorizer: FavoriOffresEmploiAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    offresEmploiRepository = stubInterface(sandbox)
    favoriOffresEmploiAuthorizer = new FavoriOffresEmploiAuthorizer(
      offresEmploiRepository
    )
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
        const result = await favoriOffresEmploiAuthorizer.authorize(
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
        const call = favoriOffresEmploiAuthorizer.authorize(
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
