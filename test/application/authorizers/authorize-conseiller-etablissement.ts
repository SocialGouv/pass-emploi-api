import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect } from '../../utils'
import { ConseillerEtablissementAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-etablissement'
import { Conseiller } from '../../../src/domain/conseiller'

describe('ConseillerEtablissementAuthorizer', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let conseillerForJeuneAuthorizer: ConseillerEtablissementAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    conseillerForJeuneAuthorizer = new ConseillerEtablissementAuthorizer(
      conseillerRepository
    )
  })

  describe('authorize', () => {
    describe('quand le conseiller est sur le bon établissement', () => {
      it('retourne un success', async () => {
        // Given
        const conseiller = unConseiller({
          agence: {
            id: 'un-etablissement'
          }
        })
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)

        // When
        const result = await conseillerForJeuneAuthorizer.authorize(
          'un-etablissement',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })

    describe('quand le conseiller est sur un autre établissement', () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller({
          agence: {
            id: 'un-autre-etablissement'
          }
        })
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)

        // When
        const result = await conseillerForJeuneAuthorizer.authorize(
          'un-etablissement',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
