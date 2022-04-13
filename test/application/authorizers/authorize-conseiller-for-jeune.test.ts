import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { Unauthorized } from '../../../src/domain/erreur'
import { Jeune } from '../../../src/domain/jeune'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect } from '../../utils'

describe('ConseillerForJeuneAuthorizer', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerForJeuneAuthorizer: ConseillerForJeuneAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerForJeuneAuthorizer = new ConseillerForJeuneAuthorizer(
      jeuneRepository
    )
  })

  describe('authorize', () => {
    describe('quand le conseiller du jeune est celui authentifié', () => {
      it("valide l'autorisation", async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        const jeune = unJeune(conseiller)
        jeuneRepository.get.withArgs('un-jeune').resolves(jeune)

        // When
        const result = await conseillerForJeuneAuthorizer.authorize(
          'un-jeune',
          utilisateur
        )

        // Then
        expect(result).to.be.equal(undefined)
      })
    })
    describe("quand le conseiller du jeune n'est pas celui authentifié", () => {
      it('retourne une erreur', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        const unAutreConseiller: Conseiller = {
          id: 'un-autre-conseiller',
          lastName: 'Dylan',
          firstName: 'Bob',
          structure: Core.Structure.POLE_EMPLOI
        }
        const jeune = unJeune({ conseiller: unAutreConseiller })
        jeuneRepository.get.withArgs('un-jeune').resolves(jeune)

        // When
        const call = conseillerForJeuneAuthorizer.authorize(
          'un-jeune',
          utilisateur
        )

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
    describe("quand le jeune n'existe pas", () => {
      it('retourne une erreur', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        jeuneRepository.get.withArgs('un-jeune').resolves(undefined)

        // When
        const call = conseillerForJeuneAuthorizer.authorize(
          'un-jeune',
          utilisateur
        )

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
