import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { createSandbox } from 'sinon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  UpdateJeuneCommand,
  UpdateJeuneCommandHandler
} from '../../../src/application/commands/update-jeune.command.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('UpdateJeuneCommandHandler', () => {
  let updateJeuneCommandHandler: UpdateJeuneCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(() => {
    jeuneRepository = stubInterface(createSandbox())
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    updateJeuneCommandHandler = new UpdateJeuneCommandHandler(
      jeuneRepository,
      jeuneAuthorizer
    )
  })

  describe('authorize', () => {
    it('autorise le jeune', async () => {
      // Given
      const command: UpdateJeuneCommand = {
        idJeune: 'idDeJohn',
        dateSignatureCGU: undefined
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await updateJeuneCommandHandler.authorize(command, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idDeJohn',
        utilisateur
      )
    })
  })

  describe('handle', () => {
    it('met à jour les CGU', async () => {
      // Given
      const jeune = unJeune()
      const command: UpdateJeuneCommand = {
        idJeune: 'idDeJohn',
        dateSignatureCGU: '2022-10-10'
      }
      jeuneRepository.get.withArgs('idDeJohn').resolves(jeune)

      // When
      const result = await updateJeuneCommandHandler.handle(command)

      // Then
      expect(jeuneRepository.save).to.have.been.calledWithExactly({
        ...jeune,
        dateSignatureCGU: DateTime.fromISO(command.dateSignatureCGU!)
      })
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
