import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { RendezVousAuthorizer } from '../../../src/application/authorizers/authorize-rendezvous'
import { Unauthorized } from '../../../src/domain/erreur'
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
    describe('quand le conseillé connecté est lié au rdv', () => {
      it("valide l'autorisation", async () => {
        // Given
        const conseiller = unConseiller()
        const jeune = unJeune(conseiller)
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        const rendezVous = { ...unRendezVous({}, jeune), id: 'rdv-id' }

        rendezVousRepository.get.withArgs('rdv-id').resolves(rendezVous)

        // When
        const result = await rendezVousAuthorizer.authorize(
          'rdv-id',
          utilisateur
        )

        // Then
        expect(result).to.be.equal(undefined)
      })
    })
    describe("quand le conseillé connecté n'est pas lié au rdv", () => {
      it('rejette', async () => {
        // Given
        const conseiller = unConseiller()
        const jeune = unJeune(conseiller)
        const rendezVous = { ...unRendezVous({}, jeune), id: 'rdv-id' }
        const utilisateur = unUtilisateurConseiller({
          id: 'un_autre-conseiller'
        })

        rendezVousRepository.get.withArgs('rdv-id').resolves(rendezVous)

        // When
        const call = rendezVousAuthorizer.authorize('rdv-id', utilisateur)

        // Then
        expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
