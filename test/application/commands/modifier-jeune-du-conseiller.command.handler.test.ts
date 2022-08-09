import {
  ModifierJeuneDuConseillerCommand,
  ModifierJeuneDuConseillerCommandHandler
} from '../../../src/application/commands/modifier-jeune-du-conseiller.command.handler'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { Core } from '../../../src/domain/core'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'

describe('ModifierJeuneDuConseillerCommandHandler', () => {
  let modifierJeuneDuConseillerCommandHandler: ModifierJeuneDuConseillerCommandHandler
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>
  let jeuneRepository: StubbedType<Jeune.Repository>

  const jeune = unJeune()
  const command: ModifierJeuneDuConseillerCommand = {
    idJeune: jeune.id,
    idPartenaire: 'id-nouveau'
  }

  beforeEach(() => {
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)
    jeuneRepository = stubInterface(createSandbox())
    modifierJeuneDuConseillerCommandHandler =
      new ModifierJeuneDuConseillerCommandHandler(
        jeuneRepository,
        conseillerForJeuneAuthorizer
      )
  })

  describe('authorize', () => {
    it('authorize un conseiller PE du jeune', async () => {
      // Given
      const conseillerPE = unUtilisateurConseiller({
        structure: Core.Structure.POLE_EMPLOI
      })
      conseillerForJeuneAuthorizer.authorize
        .withArgs(jeune.id, conseillerPE)
        .resolves(emptySuccess())

      // When
      const result = await modifierJeuneDuConseillerCommandHandler.authorize(
        command,
        conseillerPE
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('rejette les autres', async () => {
      // Given
      const conseillerPE = unUtilisateurConseiller({
        structure: Core.Structure.MILO
      })

      // When
      const result = await modifierJeuneDuConseillerCommandHandler.authorize(
        command,
        conseillerPE
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      it('met à jour son id partenaire', async () => {
        // Given
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        // When
        const result = await modifierJeuneDuConseillerCommandHandler.handle(
          command
        )

        // Then
        const expected: Jeune = {
          ...jeune,
          idPartenaire: command.idPartenaire
        }
        expect(jeuneRepository.save).to.have.been.calledWithExactly(expected)
        expect(result).to.deep.equal(emptySuccess())
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie une erreur', async () => {
        // Given
        jeuneRepository.get.withArgs(jeune.id).resolves(undefined)

        // When
        const result = await modifierJeuneDuConseillerCommandHandler.handle(
          command
        )

        // Then
        expect(jeuneRepository.save).not.to.have.been.called()
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', command.idJeune))
        )
      })
    })
  })
})
