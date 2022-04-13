import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { Authentification } from '../../../src/domain/authentification'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { Unauthorized } from '../../../src/domain/erreur'
import { Jeune } from '../../../src/domain/jeune'
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

  describe('authorize', () => {
    describe('action sur un conseiller', () => {
      describe("quand c'est le conseiller authentifié", () => {
        it("ne retourne pas d'erreur", async () => {
          // Given
          const conseiller = unConseiller()
          const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
          conseillerRepository.get.withArgs(utilisateur.id).resolves(conseiller)
          // When
          const result = await conseillerAuthorizer.authorize(
            conseiller.id,
            utilisateur
          )

          // Then
          expect(result).to.equal(undefined)
        })
      })
    })
    describe('action sur un jeune', () => {
      describe("quand c'est le conseiller du jeune en question", () => {
        it("ne retourne pas d'erreur", async () => {
          // Given
          const conseiller = unConseiller()
          const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
          conseillerRepository.get.withArgs(utilisateur.id).resolves(conseiller)

          const jeune = unJeune(conseiller)
          jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

          // When
          const result = await conseillerAuthorizer.authorize(
            conseiller.id,
            utilisateur,
            jeune.id
          )

          // Then
          expect(result).to.equal(undefined)
        })
      })
      describe("quand le jeune n'existe pas", () => {
        it('retourne une erreur', async () => {
          // Given
          const conseiller = unConseiller()
          const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
          conseillerRepository.get.withArgs(utilisateur.id).resolves(conseiller)

          const jeune = unJeune(conseiller)
          jeuneRepository.get.withArgs(jeune.id).resolves(undefined)

          // When
          const call = conseillerAuthorizer.authorize(
            conseiller.id,
            utilisateur,
            jeune.id
          )

          // Then
          await expect(call).to.be.rejectedWith(Unauthorized)
        })
      })
    })
    describe("quand ce n'est pas le conseiller authentifié", () => {
      it('retourne une erreur', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        const unAutreConseiller: Conseiller = {
          id: 'un-autre-conseiller',
          lastName: 'Dylan',
          firstName: 'Bob',
          structure: Core.Structure.POLE_EMPLOI
        }
        conseillerRepository.get
          .withArgs(unAutreConseiller.id)
          .resolves(unAutreConseiller)

        const jeune = unJeune(conseiller)
        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)

        // When
        const call = conseillerAuthorizer.authorize(
          unAutreConseiller.id,
          utilisateur
        )

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
    describe("quand le conseiller n'existe pas", () => {
      it('retourne une erreur', async () => {
        // Given
        const conseiller = unConseiller()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })
        conseillerRepository.get.withArgs(utilisateur.id).resolves(undefined)
        // When
        const call = conseillerAuthorizer.authorize(conseiller.id, utilisateur)

        // Then
        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })
  })

  describe('authorizeConseiller', () => {
    it('autorise un conseiller', async () => {
      // Given
      const superviseur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      conseillerRepository.get.withArgs(superviseur.id).resolves(unConseiller())

      // When
      const promise = conseillerAuthorizer.authorizeConseiller(superviseur)

      // Then
      await expect(promise).to.be.fulfilled
    })
    it('autorise un conseiller avec la bonne structure', async () => {
      // Given
      const superviseur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      conseillerRepository.get.withArgs(superviseur.id).resolves(unConseiller())

      // When
      const promise = conseillerAuthorizer.authorizeConseiller(superviseur)

      // Then
      await expect(promise).to.be.fulfilled
    })

    it('interdit un conseiller inexistant', async () => {
      // Given
      const utilisateur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      conseillerRepository.get.withArgs(utilisateur.id).resolves(undefined)

      // When
      let error
      try {
        await conseillerAuthorizer.authorizeConseiller(utilisateur)
      } catch (e) {
        error = e
      }

      // Then
      expect(error).to.be.an.instanceof(DroitsInsuffisants)
    })

    it('interdit un jeune qui se ferait passer pour un conseiller', async () => {
      // Given
      const jeune: Authentification.Utilisateur = unUtilisateurJeune()
      conseillerRepository.get.withArgs(jeune.id).resolves(unConseiller())

      // When
      let error
      try {
        await conseillerAuthorizer.authorizeConseiller(jeune)
      } catch (e) {
        error = e
      }

      // Then
      expect(error).to.be.an.instanceof(DroitsInsuffisants)
    })
  })

  describe('authorizeSuperviseur', () => {
    it('autorise un conseiller superviseur', async () => {
      // Given
      const superviseur: Authentification.Utilisateur = unUtilisateurConseiller(
        { roles: [Authentification.Role.SUPERVISEUR] }
      )
      conseillerRepository.get.withArgs(superviseur.id).resolves(unConseiller())

      // When
      const promise = conseillerAuthorizer.authorizeSuperviseur(superviseur)

      // Then
      await expect(promise).to.be.fulfilled
    })

    it('interdit un conseiller non superviseur', async () => {
      // Given
      const conseiller: Authentification.Utilisateur = unUtilisateurConseiller()
      conseillerRepository.get.withArgs(conseiller.id).resolves(unConseiller())

      // When
      let error
      try {
        await conseillerAuthorizer.authorizeSuperviseur(conseiller)
      } catch (e) {
        error = e
      }

      // Then
      expect(error).to.be.an.instanceof(DroitsInsuffisants)
    })

    it('interdit un conseiller inexistant', async () => {
      // Given
      const utilisateur: Authentification.Utilisateur =
        unUtilisateurConseiller()
      conseillerRepository.get.withArgs(utilisateur.id).resolves(undefined)

      // When
      let error
      try {
        await conseillerAuthorizer.authorizeSuperviseur(utilisateur)
      } catch (e) {
        error = e
      }

      // Then
      expect(error).to.be.an.instanceof(DroitsInsuffisants)
    })

    it('interdit un jeune qui se ferait passer pour un conseiller', async () => {
      // Given
      const jeune: Authentification.Utilisateur = unUtilisateurJeune()
      conseillerRepository.get.withArgs(jeune.id).resolves(unConseiller())

      // When
      let error
      try {
        await conseillerAuthorizer.authorizeSuperviseur(jeune)
      } catch (e) {
        error = e
      }

      // Then
      expect(error).to.be.an.instanceof(DroitsInsuffisants)
    })
  })
})
