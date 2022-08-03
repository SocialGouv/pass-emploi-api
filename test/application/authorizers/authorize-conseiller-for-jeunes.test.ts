import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { expect } from 'test/utils'
import { AuthorizeConseillerForJeunes } from '../../../src/application/authorizers/authorize-conseiller-for-jeunes'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
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
    it('retourne une failure', async () => {
      // When
      const result = await conseillerAuthorizer.authorize(
        ['1'],
        unUtilisateurJeune()
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe("quand tous les jeunes n'appartiennent pas au conseiller", () => {
    it('retourne une failure', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      jeuneRepository.findAllJeunesByConseiller
        .withArgs(['1'], utilisateur.id)
        .resolves([])

      // When
      const result = await conseillerAuthorizer.authorize(['1'], utilisateur)

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe("quand c'est OK", () => {
    it('retourne une success', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      jeuneRepository.findAllJeunesByConseiller
        .withArgs(['1'], utilisateur.id)
        .resolves([unJeune()])

      // When
      const result = await conseillerAuthorizer.authorize(['1'], utilisateur)

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
