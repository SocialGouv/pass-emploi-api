import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
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
      it('retourne un success', async () => {
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
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le conseiller du jeune n'est pas celui authentifié", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        const unAutreConseiller: Jeune.Conseiller = {
          id: 'un-autre-conseiller',
          lastName: 'Dylan',
          firstName: 'Bob'
        }
        const jeune = unJeune({ conseiller: unAutreConseiller })
        jeuneRepository.get.withArgs('un-jeune').resolves(jeune)

        // When
        const result = await conseillerForJeuneAuthorizer.authorize(
          'un-jeune',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe("quand le jeune n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        jeuneRepository.get.withArgs('un-jeune').resolves(undefined)

        // When
        const result = await conseillerForJeuneAuthorizer.authorize(
          'un-jeune',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
