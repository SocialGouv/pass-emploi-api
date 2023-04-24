import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { RechercheAuthorizer } from '../../../src/application/authorizers/recherche-authorizer'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import { createSandbox, expect } from '../../utils'

describe('RechercheAuthorizer', () => {
  let rechercheRepository: StubbedType<Recherche.Repository>
  let rechercheAuthorizer: RechercheAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    rechercheRepository = stubInterface(sandbox)
    rechercheAuthorizer = new RechercheAuthorizer(rechercheRepository)
  })

  describe('autoriserLeJeunePourSaRecherche', () => {
    describe('quand la recherche existe et est liée au jeune', () => {
      it('retourne un success', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const recherche = uneRecherche()

        rechercheRepository.existe
          .withArgs(recherche.id, utilisateur.id)
          .resolves(true)

        // When
        const result =
          await rechercheAuthorizer.autoriserLeJeunePourSaRecherche(
            utilisateur.id,
            recherche.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le jeune n'a pas cette recherche", () => {
      it('retourne une failure', async () => {
        // Given
        const utilisateur = unUtilisateurJeune()
        const recherche = uneRecherche()

        rechercheRepository.existe
          .withArgs('une-recherche', utilisateur.id)
          .resolves(false)

        // When
        const result =
          await rechercheAuthorizer.autoriserLeJeunePourSaRecherche(
            utilisateur.id,
            recherche.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
