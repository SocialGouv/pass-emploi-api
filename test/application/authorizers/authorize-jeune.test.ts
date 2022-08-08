import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
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
      it('retourne un success', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(true)

        // When
        const result = await jeuneAuthorizer.authorize('jeune-id', utilisateur)

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le jeune n'est pas celui connecté", () => {
      it('retourne une failure', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'autre-jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(true)

        // When
        const result = await jeuneAuthorizer.authorize('jeune-id', utilisateur)

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
      describe('quand un conseiller est connecté', () => {
        it('retourne une failure', async () => {
          // Given
          const utilisateur = unUtilisateurConseiller({ id: 'id' })

          jeuneRepository.existe.withArgs('id').resolves(true)

          // When
          const result = await jeuneAuthorizer.authorize('id', utilisateur)

          // Then
          expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
        })
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'jeune-id' })

        jeuneRepository.existe.withArgs('jeune-id').resolves(false)

        // When
        const result = await jeuneAuthorizer.authorize('jeune-id', utilisateur)

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
