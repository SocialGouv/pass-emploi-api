import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Unauthorized } from '../../../src/domain/erreur'
import { Jeune } from '../../../src/domain/jeune'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { createSandbox, expect } from '../../utils'
import { JeunePoleEmploiAuthorizer } from '../../../src/application/authorizers/authorize-jeune-pole-emploi'
import { Core } from '../../../src/domain/core'
import Structure = Core.Structure

describe('JeunePoleEmploiAuthorizer', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    jeunePoleEmploiAuthorizer = new JeunePoleEmploiAuthorizer(jeuneRepository)
  })

  describe('authorize', () => {
    describe('quand le jeune vient de POLE EMPLOI', () => {
      describe('quand le jeune est bien celui connecté', () => {
        it("valide l'autorisation", async () => {
          // Given
          const utilisateur = unUtilisateurJeune({
            id: 'jeune-id',
            structure: Structure.POLE_EMPLOI
          })

          jeuneRepository.existe.withArgs('jeune-id').resolves(true)

          // When
          const result = await jeunePoleEmploiAuthorizer.authorize(
            'jeune-id',
            utilisateur
          )

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
          const call = jeunePoleEmploiAuthorizer.authorize(
            'jeune-id',
            utilisateur
          )

          // Then
          expect(call).to.be.rejectedWith(Unauthorized)
        })
      })
    })
    describe('quand le jeune ne vient pas de POLE EMPLOI', () => {
      it('retourne une erreur', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'autre-jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(true)

        // When
        const call = jeunePoleEmploiAuthorizer.authorize(
          'jeune-id',
          utilisateur
        )

        // Then
        expect(call).to.be.rejectedWith(Unauthorized)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('retourne une erreur', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(false)

        // When
        const call = jeunePoleEmploiAuthorizer.authorize(
          'jeune-id',
          utilisateur
        )

        // Then
        expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
