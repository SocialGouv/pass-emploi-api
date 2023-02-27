import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { unConseillerDuJeune, unJeune } from 'test/fixtures/jeune.fixture'
import { ConseillerAgenceAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-agence'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect } from '../../utils'
import { Action } from '../../../src/domain/action/action'
import { RendezVous } from '../../../src/domain/rendez-vous/rendez-vous'
import {
  unJeuneDuRendezVous,
  unRendezVous
} from '../../fixtures/rendez-vous.fixture'

describe('ConseillerAgenceAuthorizer', () => {
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let actionRepository: StubbedType<Action.Repository>
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let conseillerAgenceAuthorizer: ConseillerAgenceAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    actionRepository = stubInterface(sandbox)
    rendezVousRepository = stubInterface(sandbox)
    conseillerAgenceAuthorizer = new ConseillerAgenceAuthorizer(
      conseillerRepository,
      jeuneRepository,
      actionRepository,
      rendezVousRepository
    )
  })

  describe('authorizeConseillerDeLAgence', () => {
    describe('quand le conseiller est sur le bonne agence', () => {
      it('retourne un success', async () => {
        // Given
        const conseiller = unConseiller({
          agence: {
            id: 'une-agence'
          }
        })
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)

        // When
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerDeLAgence(
            'une-agence',
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand le conseiller est sur une autre agence', () => {
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
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerDeLAgence(
            'une-agence',
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('authorizeConseillerDuJeuneOuSonAgence', () => {
    describe('quand aucun conseiller n’a renseigné son agence', () => {
      it('retourne une failure', async () => {
        // Given
        const jeune = unJeune({
          id: 'id-jeune',
          conseiller: {
            firstName: 'prenom',
            lastName: 'nom',
            id: '1'
          }
        })
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        const conseillerUtilisateur = unConseiller({
          id: '2'
        })

        conseillerRepository.get
          .withArgs(conseillerUtilisateur.id)
          .resolves(conseillerUtilisateur)

        const utilisateur = unUtilisateurConseiller({
          id: conseillerUtilisateur.id
        })

        // When
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerDuJeuneOuSonAgence(
            'id-jeune',
            utilisateur
          )
        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe('quand l’agence du conseiller utilisateur est différente de l’agence du conseiller du jeune', () => {
      it('retourne une failure', async () => {
        // Given
        const jeune = unJeune({
          id: 'id-jeune',
          conseiller: {
            firstName: 'prenom',
            lastName: 'nom',
            id: '1',
            idAgence: 'id-etablissement-1'
          }
        })

        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        const conseillerUtilisateur = unConseiller({
          id: '2',
          agence: {
            id: 'id-etablissement-2'
          }
        })

        conseillerRepository.get
          .withArgs(conseillerUtilisateur.id)
          .resolves(conseillerUtilisateur)

        const utilisateur = unUtilisateurConseiller({
          id: conseillerUtilisateur.id
        })

        // When
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerDuJeuneOuSonAgence(
            'id-jeune',
            utilisateur
          )
        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe('quand l’agence du conseiller utilisateur n’a pas renseigné son agence', () => {
      it('retourne une failure', async () => {
        // Given
        const jeune = unJeune({
          id: 'id-jeune',
          conseiller: {
            firstName: 'prenom',
            lastName: 'nom',
            id: '1',
            idAgence: 'id-etablissement-1'
          }
        })

        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        const conseillerUtilisateur = unConseiller({
          id: '2',
          agence: undefined
        })

        conseillerRepository.get
          .withArgs(conseillerUtilisateur.id)
          .resolves(conseillerUtilisateur)

        const utilisateur = unUtilisateurConseiller({
          id: conseillerUtilisateur.id
        })

        // When
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerDeLActionDuJeuneOuSonAgence(
            'id-jeune',
            utilisateur
          )
        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe('quand le conseiller utilisateur et le conseiller du jeune ont la même agence', () => {
      it('retourne un success', async () => {
        // Given
        const jeune = unJeune({
          id: 'id-jeune',
          conseiller: {
            firstName: 'prenom',
            lastName: 'nom',
            id: 'id-conseiller-jeune',
            idAgence: 'id-etablissement-jeune'
          }
        })

        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        const conseillerUtilisateur = unConseiller({
          id: 'id-conseiller-utilisateur',
          agence: {
            id: 'id-etablissement-jeune'
          }
        })

        conseillerRepository.get
          .withArgs(conseillerUtilisateur.id)
          .resolves(conseillerUtilisateur)

        const utilisateur = unUtilisateurConseiller({
          id: conseillerUtilisateur.id
        })

        // When
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerDuJeuneOuSonAgence(
            'id-jeune',
            utilisateur
          )
        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })

  describe('authorizeSiRendezVousAvecUnJeuneDuMemeEtablissement', () => {
    describe('quand le conseiller utilisateur n’est dans la même agence qu’aucun des conseillers des jeunes du rendez-vous', () => {
      it('retourne une failure', async () => {
        // Given
        const conseillerUtilisateur = unConseiller({
          id: '1',
          agence: {
            id: 'id-etablissement-1'
          }
        })
        conseillerRepository.get
          .withArgs(conseillerUtilisateur.id)
          .resolves(conseillerUtilisateur)

        const utilisateur = unUtilisateurConseiller({
          id: conseillerUtilisateur.id
        })

        const rendezVous = unRendezVous({
          jeunes: [
            unJeuneDuRendezVous({
              conseiller: unConseillerDuJeune({
                idAgence: 'id-etablissement-2'
              })
            }),
            unJeuneDuRendezVous({
              conseiller: unConseillerDuJeune({
                idAgence: 'id-etablissement-3'
              })
            })
          ]
        })
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)

        // When
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerAvecUnJeuneDeLAgenceMILODansLeRendezVous(
            rendezVous.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe('quand le conseiller utilisateur partage la même agence avec au moins un des conseillers des jeunes du rendez-vous', () => {
      it('valide le conseiller', async () => {
        // Given
        const conseillerUtilisateur = unConseiller({
          id: '1',
          agence: {
            id: 'id-etablissement-1'
          }
        })
        conseillerRepository.get
          .withArgs(conseillerUtilisateur.id)
          .resolves(conseillerUtilisateur)

        const utilisateur = unUtilisateurConseiller({
          id: conseillerUtilisateur.id
        })

        const rendezVous = unRendezVous({
          jeunes: [
            unJeuneDuRendezVous({
              conseiller: unConseillerDuJeune({
                idAgence: 'id-etablissement-2'
              })
            }),
            unJeuneDuRendezVous({
              conseiller: unConseillerDuJeune({
                idAgence: 'id-etablissement-1'
              })
            })
          ]
        })
        rendezVousRepository.get.withArgs(rendezVous.id).resolves(rendezVous)

        // When
        const result =
          await conseillerAgenceAuthorizer.authorizeConseillerAvecUnJeuneDeLAgenceMILODansLeRendezVous(
            rendezVous.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
})
