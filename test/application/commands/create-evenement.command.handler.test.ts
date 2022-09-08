import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import {
  CreateEvenementCommand,
  CreateEvenementCommandHandler
} from '../../../src/application/commands/create-evenement.command.handler'
import { Authentification } from '../../../src/domain/authentification'
import { Core } from '../../../src/domain/core'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

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
          type: Evenement.Code.MESSAGE_ENVOYE,
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
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe("quand l'émetteur n'est pas l'utilisateur", () => {
      it("rejette l'utilisateur", async () => {
        // Given
        const command: CreateEvenementCommand = {
          type: Evenement.Code.MESSAGE_ENVOYE,
          emetteur: {
            type: Authentification.Type.JEUNE,
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
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
  describe('monitor', () => {
    it('appelle le service de monitoring pour créer le bon évènement', async () => {
      // Given
      const command: CreateEvenementCommand = {
        type: Evenement.Code.MESSAGE_ENVOYE,
        emetteur: {
          type: Authentification.Type.CONSEILLER,
          structure: Core.Structure.MILO,
          id: '1'
        }
      }
      const utilisateur = unUtilisateurConseiller()

      // When
      await createEvenementCommandHandler.monitor(utilisateur, command)

      // Then
      expect(evenementService.creer).to.be.calledWith(command.type, utilisateur)
    })
  })
})
