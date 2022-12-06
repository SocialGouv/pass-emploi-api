import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { expect } from 'test/utils'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { AuthorizeConseillerForJeunesTransferesTemporairement } from '../../../src/application/authorizers/authorize-conseiller-for-jeunes-transferes'

describe('AuthorizeConseillerForJeunesTransferesTemporairement', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerAuthorizer: AuthorizeConseillerForJeunesTransferesTemporairement

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)

    conseillerAuthorizer =
      new AuthorizeConseillerForJeunesTransferesTemporairement(jeuneRepository)
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

  describe("quand c'est un conseiller", () => {
    describe("quand un des jeunes n'est pas suivi par le conseiller", () => {
      it('retourne une failure', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        jeuneRepository.findAll.withArgs(['1']).resolves([
          unJeune({
            conseiller: {
              id: 'autreConseiller',
              lastName: 'autreConseiller',
              firstName: 'autreConseiller'
            },
            conseillerInitial: undefined
          })
        ])

        // When
        const result = await conseillerAuthorizer.authorize(['1'], utilisateur)

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe('quand le jeune est suivi par le conseiller', () => {
      it('retourne une success', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        jeuneRepository.findAll.withArgs(['1']).resolves([unJeune()])

        // When
        const result = await conseillerAuthorizer.authorize(['1'], utilisateur)

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })

    describe('quand le jeune est suivi temporairement par un autre conseiller', () => {
      it('retourne une success', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        jeuneRepository.findAll.withArgs(['1']).resolves([
          unJeune({
            conseiller: {
              id: 'autreConseillerId',
              lastName: 'autreConseillerNom',
              firstName: 'autreConseillerPrenom'
            },
            conseillerInitial: {
              id: utilisateur.id
            }
          })
        ])

        // When
        const result = await conseillerAuthorizer.authorize(['1'], utilisateur)

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
})
