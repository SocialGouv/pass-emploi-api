import {
  CreateEvenementCommand,
  CreateEvenementCommandHandler
} from '../../../src/application/commands/create-evenement.command.handler'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { Unauthorized } from '../../../src/domain/erreur'

describe('CreateActionCommandHandler', () => {
  let evenementService: StubbedClass<EvenementService>
  let createEvenementCommandHandler: CreateEvenementCommandHandler

  beforeEach(async () => {
    evenementService = stubClass(EvenementService)
    createEvenementCommandHandler = new CreateEvenementCommandHandler(
      evenementService
    )
  })
  describe('authorize', () => {
    describe("quand l'émetteur est bien l'utilisateur", () => {
      it("autorise l'utilisateur à créer l'évènement", async () => {
        // Given
        const command: CreateEvenementCommand = {
          type: Evenement.Type.MESSAGE_ENVOYE,
          emetteur: {
            type: Authentification.Type.CONSEILLER,
            structure: Core.Structure.MILO,
            id: '1'
          }
        }
        const utilisateur = unUtilisateurConseiller()

        // When
        const result = await createEvenementCommandHandler.authorize(
          command,
          utilisateur
        )

        // Then
        expect(result).to.be.equal(undefined)
      })
    })
    describe("quand l'émetteur n'est pas l'utilisateur", () => {
      it("rejette l'utilisateur", async () => {
        // Given
        const command: CreateEvenementCommand = {
          type: Evenement.Type.MESSAGE_ENVOYE,
          emetteur: {
            type: Authentification.Type.JEUNE,
            structure: Core.Structure.MILO,
            id: '1'
          }
        }
        const utilisateur = unUtilisateurConseiller()

        // When
        const result = createEvenementCommandHandler.authorize(
          command,
          utilisateur
        )

        // Then
        await expect(result).to.be.rejectedWith(Unauthorized)
      })
    })
  })
})
