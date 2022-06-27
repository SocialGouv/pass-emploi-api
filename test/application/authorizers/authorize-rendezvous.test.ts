import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { RendezVousAuthorizer } from '../../../src/application/authorizers/authorize-rendezvous'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect } from '../../utils'

describe('RendezVousAuthorizer', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let rendezVousAuthorizer: RendezVousAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    rendezVousAuthorizer = new RendezVousAuthorizer(rendezVousRepository)
  })

  describe('authorize', () => {
    describe('quand au moins un des jeunes du conseiller qui fait la requête est dans le rendez-vous', () => {
      it('retourne un success', async () => {
        // Given
        const conseiller = unConseiller()
        const jeune = unJeune(conseiller)
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        const rendezVous = {
          ...unRendezVous({ jeunes: [jeune] }),
          id: 'rdv-id'
        }

        rendezVousRepository.get.withArgs('rdv-id').resolves(rendezVous)

        // When
        const result = await rendezVousAuthorizer.authorize(
          'rdv-id',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand aucun des jeunes du conseiller qui fait la requête n'est dans le rendez-vous", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const jeune = unJeune(conseiller)
        const rendezVous = {
          ...unRendezVous({ jeunes: [jeune] }),
          id: 'rdv-id'
        }
        const utilisateur = unUtilisateurConseiller({
          id: 'un_autre-conseiller'
        })

        rendezVousRepository.get.withArgs('rdv-id').resolves(rendezVous)

        // When
        const result = await rendezVousAuthorizer.authorize(
          'rdv-id',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})
