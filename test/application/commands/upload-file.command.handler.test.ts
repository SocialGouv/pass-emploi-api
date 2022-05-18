import { Fichier } from '../../../src/domain/fichier'
import { AuthorizeConseillerForJeunes } from '../../../src/application/authorizers/authorize-conseiller-for-jeunes'
import { expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import {
  UploadFileCommand,
  UploadFileCommandHandler
} from '../../../src/application/commands/upload-file.command.handler'
import { createSandbox } from 'sinon'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import { unFichier } from '../../fixtures/fichier.fixture'
import { NonTraitableError } from '../../../src/building-blocks/types/domain-error'

describe('UploadFileCommandHandler', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let fichierFactory: StubbedClass<Fichier.Factory>
  let authorizeConseillerForJeunes: StubbedClass<AuthorizeConseillerForJeunes>
  let uploadFileCommandHandler: UploadFileCommandHandler

  const command: UploadFileCommand = {
    file: {
      buffer: Buffer.alloc(1),
      mimeType: 'jpg',
      name: 'fichier-test.jpg',
      size: 1000
    },
    jeunesIds: ['1']
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    fichierFactory = stubClass(Fichier.Factory)
    authorizeConseillerForJeunes = stubClass(AuthorizeConseillerForJeunes)
    uploadFileCommandHandler = new UploadFileCommandHandler(
      fichierRepository,
      fichierFactory,
      authorizeConseillerForJeunes
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller pour ses jeunes', async () => {
      // When
      await uploadFileCommandHandler.authorize(
        command,
        unUtilisateurConseiller()
      )

      // Then
      expect(
        authorizeConseillerForJeunes.authorize
      ).to.have.been.calledWithExactly(
        command.jeunesIds,
        unUtilisateurConseiller()
      )
    })
  })

  describe('handle', () => {
    describe('quand la commande est valide', () => {
      it("upload l'image et retourne son id", async () => {
        // Given
        const fichier = unFichier()
        fichierFactory.creer.withArgs(command).returns(success(fichier))

        // When
        const result = await uploadFileCommandHandler.handle(command)

        // Then
        expect(fichierRepository.save).to.have.been.calledWithExactly(fichier)
        expect(result).to.been.deep.equal(
          success({
            id: fichier.id,
            nom: fichier.nom
          })
        )
      })
    })

    describe('quand la commande est invalide', () => {
      it('retourne la failure', async () => {
        // Given
        const echec = failure(new NonTraitableError('Fichier', '1'))
        fichierFactory.creer.withArgs(command).returns(echec)

        // When
        const result = await uploadFileCommandHandler.handle(command)

        // Then
        expect(fichierRepository.save).not.to.have.been.called()
        expect(result).to.been.deep.equal(echec)
      })
    })
  })
})
