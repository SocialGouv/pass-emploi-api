import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { Unauthorized } from '../../../src/domain/erreur'
import { Jeune } from '../../../src/domain/jeune'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'

describe('JeuneAuthorizer', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneAuthorizer: JeuneAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    jeuneAuthorizer = new JeuneAuthorizer(jeuneRepository)
  })

  describe('authorize', () => {
    describe('quand le jeune idoine est connecté', () => {
      it("valide l'autorisation", async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(true)

        // When
        const result = await jeuneAuthorizer.authorize('jeune-id', utilisateur)

        // Then
        expect(result).to.be.equal(undefined)
      })
    })
    describe("quand le jeune n'est pas celui connecté", () => {
      it('retourne une erreur', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'autre-jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(true)

        // When
        const call = jeuneAuthorizer.authorize('jeune-id', utilisateur)

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('retourne une erreur', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(false)

        // When
        const call = jeuneAuthorizer.authorize('jeune-id', utilisateur)

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
