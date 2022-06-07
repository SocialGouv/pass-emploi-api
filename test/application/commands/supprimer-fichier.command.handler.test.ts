import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { FichierAuthorizer } from 'src/application/authorizers/authorize-fichier'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import {
  SupprimerFichierCommand,
  SupprimerFichierCommandHandler
} from '../../../src/application/commands/supprimer-fichier.command.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { Fichier } from '../../../src/domain/fichier'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('SupprimerFichierCommandHandler', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let fichierAuthorizer: StubbedClass<FichierAuthorizer>
  let supprimerFichierCommandHandler: SupprimerFichierCommandHandler

  const command: SupprimerFichierCommand = {
    idFichier: 'test'
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    fichierAuthorizer = stubClass(FichierAuthorizer)
    supprimerFichierCommandHandler = new SupprimerFichierCommandHandler(
      fichierRepository,
      fichierAuthorizer
    )
  })

  describe('authorize', () => {
    it("valide que l'utilisateur est bien autorisé à supprimer le fichier", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      const idFichier = '1'

      // When
      await supprimerFichierCommandHandler.authorize({ idFichier }, utilisateur)

      // Then
      expect(fichierAuthorizer.authorize).to.have.been.calledWithExactly(
        idFichier,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    it('supprime le fichier', async () => {
      // Given
      fichierRepository.delete.withArgs(command.idFichier).resolves()

      // When
      const result = await supprimerFichierCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})
