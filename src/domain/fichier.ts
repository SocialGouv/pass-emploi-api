import { Injectable } from '@nestjs/common'
import { MauvaiseCommandeError } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'
import { IdService } from '../utils/id-service'
import { Authentification } from './authentification'

export interface FichierMetadata {
  id: string
  mimeType: string
  nom: string
  idsJeunes: string[]
  dateCreation: Date
  idCreateur: string
  typeCreateur: Authentification.Type
  dateSuppression?: Date
  idMessage?: string
  idAnalyse?: string
}
export interface Fichier extends FichierMetadata {
  buffer: Buffer
}

export const FichierRepositoryToken = 'FichierRepositoryToken'

export namespace Fichier {
  export interface ACreer {
    fichier: {
      buffer: Buffer
      mimeType: string
      name: string
      size: number
    }
    jeunesIds: string[]
    createur: {
      id: string
      type: Authentification.Type
    }
    idMessage?: string
  }

  export interface Repository {
    save(fichier: Fichier): Promise<void>
    delete(idFichier: string): Promise<void>
    softDelete(idFichier: string): Promise<void>
    getFichiersBefore(date: Date): Promise<FichierMetadata[]>
    getFichierMetadata(idFichier: string): Promise<FichierMetadata | undefined>
    declencherAnalyseAsynchrone(fichier: Fichier): Promise<Result>
  }

  @Injectable()
  export class Factory {
    constructor(
      private idService: IdService,
      private dateService: DateService
    ) {}

    creer(fichierACreer: Fichier.ACreer): Result<Fichier> {
      const TAILLE_MAX_FICHIER_EN_MO = 5
      const TAILLE_MAX_FICHIER_EN_BYTES = TAILLE_MAX_FICHIER_EN_MO * 1048576
      const tailleDuFichierTropGrande =
        fichierACreer.fichier.size > TAILLE_MAX_FICHIER_EN_BYTES

      const TYPES_AUTORISES = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        webp: 'image/webp'
      }
      const typeDuFichierAccepte = Object.values(TYPES_AUTORISES).includes(
        fichierACreer.fichier.mimeType
      )

      if (tailleDuFichierTropGrande) {
        return failure(
          new MauvaiseCommandeError(
            `Taille du fichier supérieure à ${TAILLE_MAX_FICHIER_EN_MO} Mo`
          )
        )
      }
      if (!typeDuFichierAccepte) {
        return failure(
          new MauvaiseCommandeError(
            `Types acceptés : ${Object.keys(TYPES_AUTORISES).join(', ')}`
          )
        )
      }

      const fichier: Fichier = {
        id: this.idService.uuid(),
        buffer: fichierACreer.fichier.buffer,
        mimeType: fichierACreer.fichier.mimeType,
        nom: fichierACreer.fichier.name,
        idsJeunes: fichierACreer.jeunesIds,
        dateCreation: this.dateService.nowJs(),
        idCreateur: fichierACreer.createur.id,
        typeCreateur: fichierACreer.createur.type,
        idMessage: fichierACreer.idMessage
      }
      return success(fichier)
    }
  }
}
