import { AuthorizeConseillerForJeunes } from '../../../src/application/authorizers/authorize-conseiller-for-jeunes'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from '../../../src/domain/jeune'
import { createSandbox } from 'sinon'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { expect } from 'test/utils'
import { Unauthorized } from '../../../src/domain/erreur'
import { unJeune } from '../../fixtures/jeune.fixture'

describe('AuthorizeConseillerForJeunes', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerAuthorizer: AuthorizeConseillerForJeunes

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)

    conseillerAuthorizer = new AuthorizeConseillerForJeunes(jeuneRepository)
  })

  describe("quand ce n'est pas un conseiller", () => {
    it('rejette', () => {
      // When
      const call = conseillerAuthorizer.authorize(['1'], unUtilisateurJeune())

      // Then
      expect(call).to.be.rejectedWith(Unauthorized)
    })
  })

  describe("quand tous les jeunes n'appartiennent pas au conseiller", () => {
    it('rejette', () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      jeuneRepository.findAllJeunesByConseiller
        .withArgs(['1'], utilisateur.id)
        .resolves([])

      // When
      const call = conseillerAuthorizer.authorize(['1'], utilisateur)

      // Then
      expect(call).to.be.rejectedWith(Unauthorized)
    })
  })

  describe("quand c'est OK", () => {
    it('accepte', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      jeuneRepository.findAllJeunesByConseiller
        .withArgs(['1'], utilisateur.id)
        .resolves([unJeune()])

      // When
      const call = conseillerAuthorizer.authorize(['1'], utilisateur)

      // Then
      await expect(call).not.to.be.rejected()
    })
  })
})
