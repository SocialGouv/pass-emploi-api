import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { ObjectStorageClient } from '../../../src/infrastructure/clients/object-storage.client'
import { FichierSqlS3Repository } from '../../../src/infrastructure/repositories/fichier-sql-s3.repository.db'
import { FichierSqlModel } from '../../../src/infrastructure/sequelize/models/fichier.sql-model'
import { unFichier, unFichierImage } from '../../fixtures/fichier.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('FichierSqlS3Repository', () => {
  DatabaseForTesting.prepare()
  let fichierSqlS3Repository: FichierSqlS3Repository
  let objectStorageClient: StubbedClass<ObjectStorageClient>

  beforeEach(async () => {
    objectStorageClient = stubClass(ObjectStorageClient)
    fichierSqlS3Repository = new FichierSqlS3Repository(objectStorageClient)
  })

  describe('.save(fichier)', () => {
    const fichierImage = unFichierImage()

    it('upload le fichier sur s3 ', async () => {
      // When
      await fichierSqlS3Repository.save(fichierImage)
      // Then
      expect(objectStorageClient.uploader).to.have.been.calledOnceWith(
        fichierImage
      )
    })
    it('persiste en db les metadonnees du fichier ', async () => {
      // When
      await fichierSqlS3Repository.save(fichierImage)
      // Then
      const fichierCree = (await FichierSqlModel.findByPk(fichierImage.id))!
      expect(fichierCree).to.not.be.null()
      expect(fichierCree.id).to.be.equal(fichierImage.id)
      expect(fichierCree.idsJeunes).to.be.deep.equal(fichierImage.idsJeunes)
      expect(fichierCree.mimeType).to.be.equal(fichierImage.mimeType)
      expect(fichierCree.nom).to.be.equal(fichierImage.nom)
      expect(fichierCree.dateCreation).to.be.deep.equal(
        fichierImage.dateCreation
      )
    })
  })

  describe('.delete(idFichier)', () => {
    it('supprime le fichier sur s3 et les metadonnees de la db', async () => {
      // Given
      const fichier = unFichier()
      await fichierSqlS3Repository.save(fichier)

      // When
      await fichierSqlS3Repository.delete(fichier.id)

      // Then
      expect(objectStorageClient.supprimer).to.have.been.calledOnceWith(
        fichier.id
      )
      const fichierTrouve = await FichierSqlModel.findByPk(fichier.id)
      expect(fichierTrouve).to.be.null()
    })
  })

  describe('.getFichierMetadata(idFichier)', () => {
    it('recupere les metadonnées du fichier', async () => {
      // Given
      const fichier = unFichier()
      await FichierSqlModel.create(fichier)

      // When
      const result = await fichierSqlS3Repository.getFichierMetadata(fichier.id)
      // Then
      expect(result?.id).to.equal(fichier.id)
    })
    it('renvoie undefined quand le fichier est inconnu', async () => {
      // When
      const result = await fichierSqlS3Repository.getFichierMetadata(
        '640c1e15-f2dc-4944-8d82-bc421a3c92da'
      )
      // Then
      expect(result).to.be.undefined()
    })
  })
})
