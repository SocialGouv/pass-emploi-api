import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { expect } from 'test/utils'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { ListeDeDiffusion } from '../../../src/domain/conseiller/liste-de-diffusion'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import { AuthorizeListeDeDiffusion } from '../../../src/application/authorizers/authorize-liste-de-diffusion'

describe('AuthorizeListeDeDiffusion', () => {
  let listeDeDiffusionRepository: StubbedType<ListeDeDiffusion.Repository>
  let conseillerAuthorizer: AuthorizeListeDeDiffusion

  beforeEach(() => {
    const sandbox = createSandbox()
    listeDeDiffusionRepository = stubInterface(sandbox)

    conseillerAuthorizer = new AuthorizeListeDeDiffusion(
      listeDeDiffusionRepository
    )
  })

  describe("quand ce n'est pas un conseiller", () => {
    it('retourne une failure', async () => {
      // When
      const result = await conseillerAuthorizer.authorize(
        '1',
        unUtilisateurJeune()
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe("quand la liste de diffusion n'appartient pas au conseiller", () => {
    it('retourne une failure', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      listeDeDiffusionRepository.get
        .withArgs('1')
        .resolves(uneListeDeDiffusion({ idConseiller: 'unAutreConseiller' }))

      // When
      const result = await conseillerAuthorizer.authorize('1', utilisateur)

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe("quand la liste de diffusion n'existe pas", () => {
    it('retourne une failure', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      listeDeDiffusionRepository.get.withArgs('1').resolves(undefined)

      // When
      const result = await conseillerAuthorizer.authorize('1', utilisateur)

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('quand tout va bien', () => {
    it('retourne une success', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      listeDeDiffusionRepository.get
        .withArgs('1')
        .resolves(uneListeDeDiffusion({ idConseiller: utilisateur.id }))

      // When
      const result = await conseillerAuthorizer.authorize('1', utilisateur)

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
