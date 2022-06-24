import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { Fichier, FichierMetadata } from '../../domain/fichier'
import { ObjectStorageClient } from '../clients/object-storage.client'
import { FichierSqlModel } from '../sequelize/models/fichier.sql-model'
import { DateService } from '../../utils/date-service'

@Injectable()
export class FichierSqlS3Repository implements Fichier.Repository {
  constructor(
    private objectStorageClient: ObjectStorageClient,
    private dateService: DateService
  ) {}

  async save(fichier: Fichier): Promise<void> {
    await this.objectStorageClient.uploader(fichier)

    await FichierSqlModel.creer({ ...fichier, dateSuppression: null })
  }

  async delete(idFichier: string): Promise<void> {
    await this.objectStorageClient.supprimer(idFichier)

    await FichierSqlModel.destroy({
      where: {
        id: idFichier
      }
    })
  }

  async softDelete(idFichier: string): Promise<void> {
    await FichierSqlModel.update(
      {
        dateSuppression: this.dateService.nowJs()
      },
      { where: { id: idFichier } }
    )
  }

  async getFichiersASupprimer(): Promise<FichierMetadata[]> {
    const quatreMoisPlusTot: Date = this.dateService
      .now()
      .minus({ months: 4 })
      .toJSDate()

    return FichierSqlModel.findAll({
      where: {
        dateSuppression: {
          [Op.is]: null
        },
        dateCreation: {
          [Op.lte]: quatreMoisPlusTot
        }
      }
    })
  }

  async getFichierMetadata(
    idFichier: string
  ): Promise<FichierMetadata | undefined> {
    const fichierSql = await FichierSqlModel.findOne({
      where: {
        id: idFichier,
        dateSuppression: {
          [Op.is]: null
        }
      }
    })

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
