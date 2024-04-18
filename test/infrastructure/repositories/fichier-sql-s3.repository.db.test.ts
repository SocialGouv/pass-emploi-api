import { DateService } from 'src/utils/date-service'
import { uneDate, uneDatetime } from 'test/fixtures/date.fixture'
import { ObjectStorageClient } from '../../../src/infrastructure/clients/object-storage.client'
import { FichierSqlS3Repository } from '../../../src/infrastructure/repositories/fichier-sql-s3.repository.db'
import { FichierSqlModel } from '../../../src/infrastructure/sequelize/models/fichier.sql-model'
import {
  unFichier,
  unFichierImage,
  unFichierMetadata
} from '../../fixtures/fichier.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('FichierSqlS3Repository', () => {
  let fichierSqlS3Repository: FichierSqlS3Repository
  let objectStorageClient: StubbedClass<ObjectStorageClient>
  const dateService = stubClass(DateService)
  const maintenant = uneDatetime()
  const quatreMoisPlusTot = uneDatetime().minus({ months: 4 })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    dateService.now.returns(maintenant)
    dateService.nowJs.returns(maintenant.toJSDate())
    objectStorageClient = stubClass(ObjectStorageClient)
    fichierSqlS3Repository = new FichierSqlS3Repository(
      objectStorageClient,
      dateService
    )
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
      expect(fichierCree.idMessage).to.be.deep.equal(fichierImage.idMessage)
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
    const fichier = unFichier()
    it('recupere les metadonnées du fichier', async () => {
      // Given
      await FichierSqlModel.create(fichier)

      // When
      const result = await fichierSqlS3Repository.getFichierMetadata(fichier.id)
      // Then
      expect(result?.id).to.equal(fichier.id)
      expect(result).to.deep.equal({
        ...unFichierMetadata(),
        dateSuppression: undefined
      })
    })

    it('renvoie undefined quand le fichier est inconnu', async () => {
      // When
      const result = await fichierSqlS3Repository.getFichierMetadata(
        '640c1e15-f2dc-4944-8d82-bc421a3c92da'
      )
      // Then
      expect(result).to.be.undefined()
    })

    it('renvoie les metadonnees avec une date de suppression quand elle existe', async () => {
      // Given
      await FichierSqlModel.upsert({
        ...fichier,
        dateSuppression: uneDate()
      })
      // When
      const result = await fichierSqlS3Repository.getFichierMetadata(fichier.id)
      // Then
      expect(result?.dateSuppression).to.deep.equal(uneDate())
    })
  })

  describe('.getIdsFichiersBefore()', () => {
    const fichierRecent = unFichierMetadata({
      dateCreation: maintenant.minus({ months: 2 }).toJSDate()
    })
    const fichierOld1 = unFichierMetadata({
      id: '640c1e15-f2dc-4944-8d82-bc421a3c92dc',
      dateCreation: maintenant.minus({ months: 4 }).toJSDate()
    })
    const fichierOld2 = unFichierMetadata({
      id: '640c1e15-f2dc-4944-8d82-bc421a3c92de',
      dateCreation: maintenant.minus({ months: 29 }).toJSDate()
    })

    it('retourne tableau vide quand aucun fichier à supprimer', async () => {
      // Given
      await FichierSqlModel.create({ ...fichierRecent })

      // When
      const results = await fichierSqlS3Repository.getIdsFichiersBefore(
        quatreMoisPlusTot.toJSDate()
      )
      // Then
      expect(results).to.deep.equal([])
    })
    it("retourne les ficheirs créés il y'a plus de 4 mois seulement", async () => {
      // Given
      await FichierSqlModel.create({ ...fichierRecent })
      await FichierSqlModel.create({ ...fichierOld1 })
      await FichierSqlModel.create({ ...fichierOld2 })

      // When
      const results = await fichierSqlS3Repository.getIdsFichiersBefore(
        quatreMoisPlusTot.toJSDate()
      )
      // Then
      expect(results.length).to.equal(2)
      expect(results[0]).to.equal(fichierOld1.id)
      expect(results[1]).to.equal(fichierOld2.id)
    })
  })

  describe('.softDelete(idFichier)', () => {
    it('met à jour la date de suppression du fichier dans les metadonnees de la db', async () => {
      // Given
      const fichier = unFichier()
      await fichierSqlS3Repository.save(fichier)

      // When
      await fichierSqlS3Repository.softDelete(fichier.id)

      // Then
      expect(objectStorageClient.supprimer).to.have.been.calledOnceWith(
        fichier.id
      )
      const fichierTrouve = await FichierSqlModel.findByPk(fichier.id)
      expect(fichierTrouve?.dateSuppression).to.deep.equal(
        maintenant.toJSDate()
      )
    })
  })
})
