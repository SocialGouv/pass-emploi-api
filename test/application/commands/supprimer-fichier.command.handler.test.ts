import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { stubClassSandbox } from 'test/utils/types'
import {
  SupprimerFichierCommand,
  SupprimerFichierCommandHandler
} from '../../../src/application/commands/supprimer-fichier.command.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { Fichier } from '../../../src/domain/fichier'
import { expect, StubbedClass } from '../../utils'
import { FichierSuppressionAuthorizer } from '../../../src/application/authorizers/authorize-fichier-suppression'

describe('SupprimerFichierCommandHandler', () => {
  const sandbox = createSandbox()
  let fichierRepository: StubbedType<Fichier.Repository>
  let fichierSuppressionAuthorizer: StubbedClass<FichierSuppressionAuthorizer>
  let supprimerFichierCommandHandler: SupprimerFichierCommandHandler

  const command: SupprimerFichierCommand = {
    idFichier: 'test'
  }

  beforeEach(() => {
    fichierRepository = stubInterface(sandbox)
    fichierSuppressionAuthorizer = stubClassSandbox(
      FichierSuppressionAuthorizer,
      sandbox
    )
    supprimerFichierCommandHandler = new SupprimerFichierCommandHandler(
      fichierRepository,
      fichierSuppressionAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('supprime le fichier', async () => {
      // Given
      fichierRepository.delete.withArgs(command.idFichier).resolves()

      // When
      const result = await supprimerFichierCommandHandler.handle(command)

      // Then
      expect(fichierRepository.delete).to.have.been.calledWithExactly(
        command.idFichier
      )
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
