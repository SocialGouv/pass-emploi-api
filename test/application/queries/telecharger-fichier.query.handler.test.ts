import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { FichierAuthorizer } from 'src/application/authorizers/authorize-fichier'
import { ObjectStorageClient } from 'src/infrastructure/clients/object-storage.client'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import {
  TelechargerFichierQuery,
  TelechargerFichierQueryHandler
} from '../../../src/application/queries/telecharger-fichier.query.handler'
import { success } from '../../../src/building-blocks/types/result'
import { Fichier } from '../../../src/domain/fichier'
import { unFichierMetadata } from '../../fixtures/fichier.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('TelechargerFichierQueryHandler', () => {
  let fichierRepository: StubbedType<Fichier.Repository>
  let fichierAuthorizer: StubbedClass<FichierAuthorizer>
  let objectStorageClient: StubbedClass<ObjectStorageClient>
  let telechargerFichierQueryHandler: TelechargerFichierQueryHandler

  const query: TelechargerFichierQuery = {
    idFichier: 'test'
  }

  beforeEach(() => {
    const sandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    fichierAuthorizer = stubClass(FichierAuthorizer)
    objectStorageClient = stubClass(ObjectStorageClient)
    telechargerFichierQueryHandler = new TelechargerFichierQueryHandler(
      fichierRepository,
      fichierAuthorizer,
      objectStorageClient
    )
  })

  describe('authorize', () => {
    it("valide que l'utilisateur est bien autorisé à télécharger le fichier", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()
      const idFichier = '1'

      // When
      await telechargerFichierQueryHandler.authorize({ idFichier }, utilisateur)

      // Then
      expect(fichierAuthorizer.authorize).to.have.been.calledWithExactly(
        idFichier,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    it("retourne l'url du fichier", async () => {
      // Given
      const url = 'test'
      const fichierMetadata = unFichierMetadata()

      fichierRepository.getFichierMetadata
        .withArgs(query.idFichier)
        .resolves(fichierMetadata)
      objectStorageClient.getUrlPresignee
        .withArgs(fichierMetadata)
        .resolves(url)

      // When
      const result = await telechargerFichierQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(success(url))
    })
  })
})
