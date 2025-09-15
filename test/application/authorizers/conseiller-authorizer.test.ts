import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { Authentification } from '../../../src/domain/authentification'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect } from '../../utils'

describe('ConseillerAuthorizer', () => {
  let jeuneRepository: StubbedType<Jeune.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let conseillerAuthorizer: ConseillerAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = new ConseillerAuthorizer(
      conseillerRepository,
      jeuneRepository
    )
  })

  describe('autoriserLeConseiller', () => {
    describe("quand c'est le conseiller authentifié", () => {
      it('retourne une success', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        conseillerRepository.get.withArgs(utilisateur.id).resolves(conseiller)
        // When
        const result = await conseillerAuthorizer.autoriserLeConseiller(
          conseiller.id,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand ce n'est pas le conseiller authentifié", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        const unAutreConseiller: Conseiller = {
          id: 'un-autre-conseiller',
          lastName: 'Dylan',
          firstName: 'Bob',
          structure: Core.Structure.POLE_EMPLOI,
          notificationsSonores: false
        }
        conseillerRepository.get
          .withArgs(unAutreConseiller.id)
          .resolves(unAutreConseiller)

        const jeune = unJeune(conseiller)
        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)

        // When
        const result = await conseillerAuthorizer.autoriserLeConseiller(
          unAutreConseiller.id,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe("quand le conseiller n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        conseillerRepository.get.withArgs(utilisateur.id).resolves(undefined)
        // When
        const result = await conseillerAuthorizer.autoriserLeConseiller(
          conseiller.id,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('autoriserLeConseillerPourSonJeune', () => {
    describe("quand c'est le conseiller du jeune en question", () => {
      it('retourne une success', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        conseillerRepository.get.withArgs(utilisateur.id).resolves(conseiller)

        const jeune = unJeune(conseiller)
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        // When
        const result =
          await conseillerAuthorizer.autoriserLeConseillerPourSonJeune(
            conseiller.id,
            jeune.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le jeune n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        conseillerRepository.get.withArgs(utilisateur.id).resolves(conseiller)

        const jeune = unJeune(conseiller)
        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)

        // When
        const result =
          await conseillerAuthorizer.autoriserLeConseillerPourSonJeune(
            conseiller.id,
            jeune.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('autoriserToutConseiller', () => {
    it('autorise un conseiller', async () => {
      // Given
      const superviseur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      conseillerRepository.get.withArgs(superviseur.id).resolves(unConseiller())

      // When
      const result = await conseillerAuthorizer.autoriserToutConseiller(
        superviseur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('autorise un conseiller avec la bonne structure', async () => {
      // Given
      const conseiller: Authentification.Utilisateur = unUtilisateurConseiller()
      conseillerRepository.get.withArgs(conseiller.id).resolves(unConseiller())

      // When
      const result = await conseillerAuthorizer.autoriserToutConseiller(
        conseiller
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('interdit un conseiller inexistant', async () => {
      // Given
      const utilisateur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      conseillerRepository.get.withArgs(utilisateur.id).resolves(undefined)

      // When
      const result = await conseillerAuthorizer.autoriserToutConseiller(
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })

    it('interdit un jeune qui se ferait passer pour un conseiller', async () => {
      // Given
      const jeune: Authentification.Utilisateur = unUtilisateurJeune()
      conseillerRepository.get.withArgs(jeune.id).resolves(unConseiller())

      // When
      const result = await conseillerAuthorizer.autoriserToutConseiller(jeune)

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('autoriserConseillerPourSonJeune', () => {
    describe('quand le conseiller du jeune est celui authentifié', () => {
      it('retourne un success', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        const jeune = unJeune(conseiller)
        jeuneRepository.get.withArgs('un-jeune').resolves(jeune)

        // When
        const result =
          await conseillerAuthorizer.autoriserConseillerPourSonJeune(
            'un-jeune',
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand le conseiller du jeune n'est pas celui authentifié", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        const unAutreConseiller: Jeune.Conseiller = {
          id: 'un-autre-conseiller',
          lastName: 'Dylan',
          firstName: 'Bob'
        }
        const jeune = unJeune({ conseiller: unAutreConseiller })
        jeuneRepository.get.withArgs('un-jeune').resolves(jeune)

        // When
        const result =
          await conseillerAuthorizer.autoriserConseillerPourSonJeune(
            'un-jeune',
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
    describe("quand le jeune n'existe pas", () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        jeuneRepository.get.withArgs('un-jeune').resolves(undefined)

        // When
        const result =
          await conseillerAuthorizer.autoriserConseillerPourSonJeune(
            'un-jeune',
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('autoriserConseillerPourSesJeunes', () => {
    describe("quand ce n'est pas un conseiller", () => {
      it('retourne une failure', async () => {
        // When
        const result =
          await conseillerAuthorizer.autoriserConseillerPourSesJeunes(
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
        jeuneRepository.findAllJeunesByIdsAndConseiller
          .withArgs(['1'], utilisateur.id)
          .resolves([])

        // When
        const result =
          await conseillerAuthorizer.autoriserConseillerPourSesJeunes(
            ['1'],
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand c'est OK", () => {
      it('retourne une success', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        jeuneRepository.findAllJeunesByIdsAndConseiller
          .withArgs(['1'], utilisateur.id)
          .resolves([unJeune()])

        // When
        const result =
          await conseillerAuthorizer.autoriserConseillerPourSesJeunes(
            ['1'],
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })

  describe('autoriserConseillerPourSesJeunesTransferes', () => {
    describe("quand ce n'est pas un conseiller", () => {
      it('retourne une failure', async () => {
        // When
        const result =
          await conseillerAuthorizer.autoriserConseillerPourSesJeunesTransferes(
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
          const result =
            await conseillerAuthorizer.autoriserConseillerPourSesJeunesTransferes(
              ['1'],
              utilisateur
            )

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
          const result =
            await conseillerAuthorizer.autoriserConseillerPourSesJeunesTransferes(
              ['1'],
              utilisateur
            )

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
          const result =
            await conseillerAuthorizer.autoriserConseillerPourSesJeunesTransferes(
              ['1'],
              utilisateur
            )

          // Then
          expect(result).to.deep.equal(emptySuccess())
        })
      })
    })
  })

  describe('autoriserConseillerSuperviseur', () => {
    it('autorise un conseiller superviseur', async () => {
      // Given
      const superviseur: Authentification.Utilisateur = unUtilisateurConseiller(
        { roles: [Authentification.Role.SUPERVISEUR] }
      )
      conseillerRepository.get.withArgs(superviseur.id).resolves(unConseiller())

      // When
      const result = await conseillerAuthorizer.autoriserConseillerSuperviseur(
        superviseur
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('interdit un conseiller non superviseur', async () => {
      // Given
      const conseiller: Authentification.Utilisateur = unUtilisateurConseiller()
      conseillerRepository.get.withArgs(conseiller.id).resolves(unConseiller())

      // When
      const result = await conseillerAuthorizer.autoriserConseillerSuperviseur(
        conseiller
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })

    it('interdit un conseiller inexistant', async () => {
      // Given
      const utilisateur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      conseillerRepository.get.withArgs(utilisateur.id).resolves(undefined)

      // When
      const result = await conseillerAuthorizer.autoriserConseillerSuperviseur(
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })

    it('interdit un jeune qui se ferait passer pour un conseiller', async () => {
      // Given
      const jeune: Authentification.Utilisateur = unUtilisateurJeune()
      conseillerRepository.get.withArgs(jeune.id).resolves(unConseiller())

      // When
      const result = await conseillerAuthorizer.autoriserConseillerSuperviseur(
        jeune
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('autoriserConseillerSuperviseurDeLEtablissement', () => {
    it('autorise un conseiller superviseur de l’établissement', async () => {
      // Given
      const idAgence = 'toto'
      const superviseur: Authentification.Utilisateur = unUtilisateurConseiller(
        { roles: [Authentification.Role.SUPERVISEUR] }
      )
      conseillerRepository.get.withArgs(superviseur.id).resolves({
        ...unConseiller,
        agence: {
          id: 'toto',
          nom: 'tata'
        }
      })

      // When
      const result =
        await conseillerAuthorizer.autoriserConseillerSuperviseurDeLEtablissement(
          superviseur,
          idAgence
        )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })

    it('interdit un conseiller superviseur qui n’est pas du même établissement', async () => {
      // Given
      const idAgence = 'toto'
      const idFakeAgence = 'idFakeAgence'

      const conseiller: Authentification.Utilisateur = unUtilisateurConseiller()
      conseillerRepository.get.withArgs(conseiller.id).resolves({
        ...unConseiller,
        agence: {
          id: idFakeAgence,
          nom: 'boarf'
        }
      })

      // When
      const result =
        await conseillerAuthorizer.autoriserConseillerSuperviseurDeLEtablissement(
          conseiller,
          idAgence
        )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})
