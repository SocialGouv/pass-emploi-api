import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  ModifierJeuneDuConseillerCommand,
  ModifierJeuneDuConseillerCommandHandler
} from '../../../src/application/commands/modifier-jeune-du-conseiller.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Core, estPoleEmploiBRSA } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'

describe('ModifierJeuneDuConseillerCommandHandler', () => {
  let modifierJeuneDuConseillerCommandHandler: ModifierJeuneDuConseillerCommandHandler
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerAuthorizer>
  let jeuneRepository: StubbedType<Jeune.Repository>

  const jeune = unJeune()
  const command: ModifierJeuneDuConseillerCommand = {
    idJeune: jeune.id,
    idPartenaire: 'id-nouveau'
  }

  beforeEach(() => {
    conseillerForJeuneAuthorizer = stubClass(ConseillerAuthorizer)
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
      conseillerForJeuneAuthorizer.autoriserConseillerPourSonJeune
        .withArgs(jeune.id, conseillerPE)
        .resolves(emptySuccess())

      // When
      await modifierJeuneDuConseillerCommandHandler.authorize(
        command,
        conseillerPE
      )

      // Then
      expect(
        conseillerForJeuneAuthorizer.autoriserConseillerPourSonJeune
      ).to.have.been.calledOnceWithExactly(
        command.idJeune,
        conseillerPE,
        estPoleEmploiBRSA(conseillerPE.structure)
      )
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
