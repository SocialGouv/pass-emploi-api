import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Conseiller } from 'src/domain/conseiller'
import { RendezVousAuthorizer } from '../../../src/application/authorizers/rendezvous-authorizer'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unConseillerDuJeune, unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { createSandbox, expect } from '../../utils'
import { Jeune } from '../../../src/domain/jeune/jeune'

describe('RendezVousAuthorizer', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let rendezVousAuthorizer: RendezVousAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    rendezVousAuthorizer = new RendezVousAuthorizer(
      rendezVousRepository,
      conseillerRepository,
      jeuneRepository
    )
  })

  describe('autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune', () => {
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
        const result =
          await rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
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
        const result =
          await rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
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
        const result =
          await rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
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
        const result =
          await rendezVousAuthorizer.autoriserConseillerPourUnRendezVousAvecAuMoinsUnJeune(
            'rdv-id',
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('authorizeRendezVousPourUnJeune', () => {
    describe('quand le rendez-vous est une animation collective', () => {
      it("retourne un success quand l'etablissement du rdv est celui du conseiller du jeune", async () => {
        // Given
        const idRdv = 'rdv-id'
        const idAgence = 'une-agence'
        const conseiller = unConseillerDuJeune({ idAgence })
        const jeune = unJeune({ conseiller })
        const utilisateur = unUtilisateurJeune({ id: jeune.id })
        const rendezVous = unRendezVous({
          id: idRdv,
          jeunes: [jeune],
          idAgence,
          type: CodeTypeRendezVous.ATELIER
        })

        rendezVousRepository.get.withArgs(idRdv).resolves(rendezVous)
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        // When
        const result =
          await rendezVousAuthorizer.autoriserJeunePourSonRendezVous(
            idRdv,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
      it("retourne une failure quand l'etablissement du rdv n'est pas celui du conseiller du jeune", async () => {
        // Given
        const idRdv = 'rdv-id'
        const conseiller = unConseiller({ agence: { id: 'une-agence' } })
        const jeune = unJeune({ conseiller })
        const utilisateur = unUtilisateurJeune({ id: jeune.id })
        const rendezVous = unRendezVous({
          id: idRdv,
          jeunes: [jeune],
          idAgence: 'une-autre-agence',
          type: CodeTypeRendezVous.ATELIER
        })

        rendezVousRepository.get.withArgs(idRdv).resolves(rendezVous)
        jeuneRepository.get.withArgs(jeune.id).resolves(conseiller)

        // When
        const result =
          await rendezVousAuthorizer.autoriserJeunePourSonRendezVous(
            idRdv,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe("quand ce n'est pas une animation collective", () => {
      describe('quand le jeune est dans le rendez vous', () => {
        it('autorise', async () => {
          // Given
          const idRdv = 'rdv-id'
          const idAgence = 'une-agence'
          const conseiller = unConseiller({ agence: { id: idAgence } })
          const jeune = unJeune({ conseiller })
          const utilisateur = unUtilisateurJeune({ id: jeune.id })
          const rendezVous = unRendezVous({
            id: idRdv,
            jeunes: [jeune],
            idAgence,
            type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
          })

          rendezVousRepository.get.withArgs(idRdv).resolves(rendezVous)

          // When
          const result =
            await rendezVousAuthorizer.autoriserJeunePourSonRendezVous(
              idRdv,
              utilisateur
            )

          // Then
          expect(result).to.deep.equal(emptySuccess())
        })
      })
      describe("quand le jeune n'est pas dans le rendez vous", () => {
        it('rejette', async () => {
          // Given
          const idRdv = 'rdv-id'
          const idAgence = 'une-agence'
          const conseiller = unConseiller()
          const jeune = unJeune({ conseiller })
          const utilisateur = unUtilisateurJeune({ id: jeune.id })
          const rendezVous = unRendezVous({
            id: idRdv,
            jeunes: [],
            idAgence,
            type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
          })

          rendezVousRepository.get.withArgs(idRdv).resolves(rendezVous)

          // When
          const result =
            await rendezVousAuthorizer.autoriserJeunePourSonRendezVous(
              idRdv,
              utilisateur
            )

          // Then
          expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
        })
      })
    })
  })
})
