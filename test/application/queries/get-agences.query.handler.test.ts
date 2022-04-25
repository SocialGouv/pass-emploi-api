import { GetAgencesQueryHandler } from '../../../src/application/queries/get-agences.query.handler'
import { AgenceQueryModel } from '../../../src/application/queries/query-models/agence.query-models'
import { Core } from '../../../src/domain/core'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { expect } from '../../utils'
import { Unauthorized } from '../../../src/domain/erreur'
import { Authentification } from '../../../src/domain/authentification'
import Structure = Core.Structure
import { Agence } from '../../../src/domain/agence'

describe('GetAgenceQuery', () => {
  describe('authorize', () => {
    const handler = new GetAgencesQueryHandler({
      get(): Promise<Agence | undefined> {
        return Promise.resolve(undefined)
      },
      getAllQueryModelsByStructure(): Promise<AgenceQueryModel[]> {
        return Promise.resolve([])
      }
    })

    describe("quand l'utilisateur est un jeune", () => {
      it('doit renvoyer unauthorized', async () => {
        // When
        const call = handler.authorize(
          { structure: Structure.MILO },
          unUtilisateurJeune()
        )

        await expect(call).to.be.rejectedWith(Unauthorized)
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
          dateDerniereConnexion: null,
          roles: []
        }

        // When
        const call = handler.authorize(
          { structure: Structure.MILO },
          jackieLeSupport
        )

        await expect(call).to.be.rejectedWith(Unauthorized)
      })
    })

    describe("quand l'utilisateur est un conseiller", () => {
      it("doit renvoyer unauthorized si il n'est pas de la même structure", async () => {
        // When
        const call = handler.authorize(
          { structure: Structure.MILO },
          unUtilisateurConseiller({ structure: Structure.POLE_EMPLOI })
        )

        await expect(call).to.be.rejectedWith(Unauthorized)
      })

      it('doit renvoyer rien si il est de la même structure', async () => {
        // When
        const call = handler.authorize(
          { structure: Structure.MILO },
          unUtilisateurConseiller({ structure: Structure.MILO })
        )

        await expect(call).to.not.be.rejected
      })
    })
  })
})
