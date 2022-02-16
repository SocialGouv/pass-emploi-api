import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Unauthorized } from '../../../src/domain/erreur'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'
import { Recherche } from '../../../src/domain/recherche'
import { RechercheAuthorizer } from '../../../src/application/authorizers/authorize-recherche'
import { uneRecherche } from '../../fixtures/recherche.fixture'

describe('RechercheAuthorizer', () => {
  let rechercheRepository: StubbedType<Recherche.Repository>
  let rechercheAuthorizer: RechercheAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    rechercheRepository = stubInterface(sandbox)
    rechercheAuthorizer = new RechercheAuthorizer(rechercheRepository)
  })

  describe('authorize', () => {
    describe('quand la recherche existe et est liée au jeune', () => {
      it("valide l'autorisation", async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const recherche = uneRecherche()

        rechercheRepository.existe
          .withArgs(recherche.id, utilisateur.id)
          .resolves(true)

        // When
        const result = await rechercheAuthorizer.authorize(
          utilisateur.id,
          recherche.id,
          utilisateur
        )

        // Then
        expect(result).to.be.equal(undefined)
      })
    })
    describe("quand le jeune n'a pas cette recherche", () => {
      it('retourne une erreur', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const recherche = uneRecherche()

        rechercheRepository.existe
          .withArgs('une-recherche', utilisateur.id)
          .resolves(false)

        // When
        const call = rechercheAuthorizer.authorize(
          utilisateur.id,
          recherche.id,
          utilisateur
        )

        // Then
        expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
