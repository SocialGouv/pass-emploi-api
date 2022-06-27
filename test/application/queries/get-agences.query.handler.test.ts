import { GetAgencesQueryHandler } from '../../../src/application/queries/get-agences.query.handler'
import { Core } from '../../../src/domain/core'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { expect } from '../../utils'
import { Authentification } from '../../../src/domain/authentification'
import Structure = Core.Structure
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'

describe('GetAgenceQuery', () => {
  describe('authorize', () => {
    const handler = new GetAgencesQueryHandler()

    describe("quand l'utilisateur est un jeune", () => {
      it('doit renvoyer unauthorized', async () => {
        // When
        const result = await handler.authorize(
          { structure: Structure.MILO },
          unUtilisateurJeune()
        )

        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur est un support", () => {
      it('doit renvoyer unauthorized', async () => {
        // Given
        const jackieLeSupport: Authentification.Utilisateur = {
          id: 'ABCDE',
          idAuthentification: 'id-authentification-jeune',
          nom: 'Doe',
          prenom: 'John',
          type: Authentification.Type.SUPPORT,
          email: 'john.doe@plop.io',
          structure: Core.Structure.MILO,
          dateDerniereConnexion: undefined,
          roles: []
        }

        // When
        const result = await handler.authorize(
          { structure: Structure.MILO },
          jackieLeSupport
        )

        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur est un conseiller", () => {
      it("doit renvoyer une failure si il n'est pas de la même structure", async () => {
        // When
        const result = await handler.authorize(
          { structure: Structure.MILO },
          unUtilisateurConseiller({ structure: Structure.POLE_EMPLOI })
        )

        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })

      it('doit renvoyer un success si il est de la même structure', async () => {
        // When
        const result = await handler.authorize(
          { structure: Structure.MILO },
          unUtilisateurConseiller({ structure: Structure.MILO })
        )

        expect(result).to.deep.equal(emptySuccess())
      })
    })
  })
})
