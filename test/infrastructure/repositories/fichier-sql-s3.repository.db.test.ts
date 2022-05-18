import { DatabaseForTesting } from 'test/utils/database-for-testing'
import { ObjectStorageClient } from '../../../src/infrastructure/clients/object-storage.client'
import { FichierSqlS3Repository } from '../../../src/infrastructure/repositories/fichier-sql-s3.repository.db'
import { FichierSqlModel } from '../../../src/infrastructure/sequelize/models/fichier.sql-model'
import { unFichierImage } from '../../fixtures/fichier.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('FichierSqlS3Repository', () => {
  DatabaseForTesting.prepare()
  let fichierSqlS3Repository: FichierSqlS3Repository
  let objectStorageClient: StubbedClass<ObjectStorageClient>
  const unFichier = unFichierImage()

  beforeEach(async () => {
    objectStorageClient = stubClass(ObjectStorageClient)
    fichierSqlS3Repository = new FichierSqlS3Repository(objectStorageClient)
  })

  describe('.save(fichier)', () => {
    it('upload le fichier sur s3 ', async () => {
      // Given
      // When
      await fichierSqlS3Repository.save(unFichier)
      // Then
      expect(objectStorageClient.uploader).to.have.been.calledOnceWith(
        unFichier
      )
    })
    it('persiste en db les metadonnees du fichier ', async () => {
      // Given
      // When
      await fichierSqlS3Repository.save(unFichier)
      // Then
      const fichierCree = (await FichierSqlModel.findByPk(unFichier.id))!
      expect(fichierCree).to.not.be.null()
      expect(fichierCree.id).to.be.equal(unFichier.id)
      expect(fichierCree.idsJeunes).to.be.deep.equal(unFichier.idsJeunes)
      expect(fichierCree.mimeType).to.be.equal(unFichier.mimeType)
      expect(fichierCree.nom).to.be.equal(unFichier.nom)
      expect(fichierCree.dateCreation).to.be.deep.equal(unFichier.dateCreation)
    })
  })
})
