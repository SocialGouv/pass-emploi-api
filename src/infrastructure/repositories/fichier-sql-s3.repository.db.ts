import { Fichier } from '../../domain/fichier'
import { Injectable } from '@nestjs/common'
import { ObjectStorageClient } from '../clients/object-storage.client'
import { FichierSqlModel } from '../sequelize/models/fichier.sql-model'

@Injectable()
export class FichierSqlS3Repository implements Fichier.Repository {
  constructor(private objectStorageClient: ObjectStorageClient) {}

  async save(fichier: Fichier): Promise<void> {
    await this.objectStorageClient.uploader(fichier)

    await FichierSqlModel.creer(fichier)
  }

  async getFichierMetadata(
    idFichier: string
  ): Promise<Fichier.FichierMetadata | undefined> {
    const fichierSql = await FichierSqlModel.findByPk(idFichier)

    if (fichierSql) {
      return {
        id: fichierSql.id,
        mimeType: fichierSql.mimeType,
        nom: fichierSql.nom,
        idsJeunes: fichierSql.idsJeunes,
        dateCreation: fichierSql.dateCreation
      }
    }
    return undefined
  }
}
