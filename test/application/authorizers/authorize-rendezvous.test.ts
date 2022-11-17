import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Conseiller } from 'src/domain/conseiller'
import { RendezVousAuthorizer } from '../../../src/application/authorizers/authorize-rendezvous'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect } from '../../utils'

describe('RendezVousAuthorizer', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let rendezVousAuthorizer: RendezVousAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    rendezVousAuthorizer = new RendezVousAuthorizer(
      rendezVousRepository,
      conseillerRepository
    )
  })

  describe('authorize', () => {
    describe('quand le rendez-vous est une animation collective', () => {
      it("retourne un success quand l'etablissement du rdv est celui du conseiller", async () => {
        // Given
        const idRdv = 'rdv-id'
        const idAgence = 'une-agence'
        const conseiller = unConseiller({ agence: { id: idAgence } })
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        const rendezVous = unRendezVous({
          id: idRdv,
          jeunes: [],
          idAgence,
          type: CodeTypeRendezVous.ATELIER
        })

        rendezVousRepository.get.withArgs(idRdv).resolves(rendezVous)
        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)

        // When
        const result = await rendezVousAuthorizer.authorize(
          'rdv-id',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
      it("retourne une failure quand l'etablissement du rdv n'est pas celui du conseiller", async () => {
        // Given
        const idRdv = 'rdv-id'
        const idAgence = 'une-agence'
        const conseiller = unConseiller({ agence: { id: 'blabla' } })
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        const rendezVous = unRendezVous({
          id: idRdv,
          jeunes: [],
          idAgence,
          type: CodeTypeRendezVous.ATELIER
        })

        rendezVousRepository.get.withArgs(idRdv).resolves(rendezVous)
        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)

        // When
        const result = await rendezVousAuthorizer.authorize(
          'rdv-id',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
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
