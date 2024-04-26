import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import {
  emptySuccess,
  isSuccess,
  Result
} from 'src/building-blocks/types/result'
import { AntivirusClient } from 'src/infrastructure/clients/antivirus-client'
import { Fichier, FichierMetadata } from '../../domain/fichier'
import { ObjectStorageClient } from '../clients/object-storage.client'
import { FichierSqlModel } from '../sequelize/models/fichier.sql-model'
import { DateService } from '../../utils/date-service'

@Injectable()
export class FichierSqlS3Repository implements Fichier.Repository {
  constructor(
    private objectStorageClient: ObjectStorageClient,
    private dateService: DateService,
    private antivirusClient: AntivirusClient
  ) {}

  async save(fichier: Fichier): Promise<void> {
    await this.objectStorageClient.uploader(fichier)

    await FichierSqlModel.creer({
      ...fichier,
      idMessage: fichier.idMessage ?? null,
      idAnalyse: null,
      dateSuppression: null
    })
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
    await this.objectStorageClient.supprimer(idFichier)

    await FichierSqlModel.update(
      {
        dateSuppression: this.dateService.nowJs()
      },
      { where: { id: idFichier } }
    )
  }

  async getIdsFichiersBefore(date: Date): Promise<string[]> {
    const fichiersSql = await FichierSqlModel.findAll({
      attributes: ['id'],
      where: {
        dateSuppression: {
          [Op.is]: null
        },
        dateCreation: {
          [Op.lte]: date
        }
      }
    })

    return fichiersSql.map(fichier => fichier.id)
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
        typeCreateur: fichierSql.typeCreateur,
        dateSuppression: fichierSql.dateSuppression ?? undefined,
        idMessage: fichierSql.idMessage ?? undefined,
        idAnalyse: fichierSql.idAnalyse ?? undefined
      }
    }
    return undefined
  }

  async declencherAnalyseAsynchrone(fichier: Fichier): Promise<Result> {
    const result = await this.antivirusClient.declencherAnalyseAsynchrone(
      fichier
    )

    if (isSuccess(result)) {
      await FichierSqlModel.update(
        { idAnalyse: result.data },
        { where: { id: fichier.id } }
      )
      return emptySuccess()
    }

    return result
  }
}
