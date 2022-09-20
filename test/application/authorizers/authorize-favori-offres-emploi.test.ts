import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { FavoriOffresEmploiAuthorizer } from '../../../src/application/authorizers/authorize-favori-offres-emploi'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { createSandbox, expect } from '../../utils'
import { Offre } from '../../../src/domain/offre/offre'

describe('FavoriOffresEmploiAuthorizer', () => {
  let offresEmploiRepository: StubbedType<Offre.Favori.Emploi.Repository>
  let favoriOffresEmploiAuthorizer: FavoriOffresEmploiAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    offresEmploiRepository = stubInterface(sandbox)
    favoriOffresEmploiAuthorizer = new FavoriOffresEmploiAuthorizer(
      offresEmploiRepository
    )
  })

  describe('authorize', () => {
    describe('quand le favori existe et est lié au jeune', () => {
      it('retourne un success', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const offreEmploi = uneOffreEmploi()

        offresEmploiRepository.get
          .withArgs(utilisateur.id, offreEmploi.id)
          .resolves(offreEmploi)

        // When
        const result = await favoriOffresEmploiAuthorizer.authorize(
          utilisateur.id,
          offreEmploi.id,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le jeune n'a pas ce favori", () => {
      it('retourne une failure', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const offreEmploi = uneOffreEmploi()

        offresEmploiRepository.get
          .withArgs(utilisateur.id, 'une-offre')
          .resolves(undefined)

        // When
        const result = await favoriOffresEmploiAuthorizer.authorize(
          utilisateur.id,
          offreEmploi.id,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
