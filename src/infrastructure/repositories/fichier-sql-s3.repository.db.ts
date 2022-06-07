import { Injectable } from '@nestjs/common'
import { Fichier, FichierMetadata } from '../../domain/fichier'
import { ObjectStorageClient } from '../clients/object-storage.client'
import { FichierSqlModel } from '../sequelize/models/fichier.sql-model'

@Injectable()
export class FichierSqlS3Repository implements Fichier.Repository {
  constructor(private objectStorageClient: ObjectStorageClient) {}

  async save(fichier: Fichier): Promise<void> {
    await this.objectStorageClient.uploader(fichier)

    await FichierSqlModel.creer(fichier)
  }

  async delete(idFichier: string): Promise<void> {
    await this.objectStorageClient.supprimer(idFichier)

    await FichierSqlModel.destroy({
      where: {
        id: idFichier
      }
    })
  }

  async getFichierMetadata(
    idFichier: string
  ): Promise<FichierMetadata | undefined> {
    const fichierSql = await FichierSqlModel.findByPk(idFichier)

    if (fichierSql) {
      return {
        id: fichierSql.id,
        mimeType: fichierSql.mimeType,
        nom: fichierSql.nom,
        idsJeunes: fichierSql.idsJeunes,
        dateCreation: fichierSql.dateCreation,
        idCreateur: fichierSql.idCreateur,
        typeCreateur: fichierSql.typeCreateur
      }
    }
    return undefined
  }
}
