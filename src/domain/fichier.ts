import { Injectable } from '@nestjs/common'
import { Result, success } from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'
import { IdService } from '../utils/id-service'

export interface Fichier {
  id: string
  buffer: Buffer
  mimeType: string
  nom: string
  idsJeunes: string[]
  dateCreation: Date
  taille: number
}

export const FichierRepositoryToken = 'FichierRepositoryToken'

export namespace Fichier {
  export interface FichierMetadata {
    id: string
    mimeType: string
    nom: string
    idsJeunes: string[]
    dateCreation: Date
  }
  export interface ACreer {
    file: {
      buffer: Buffer
      mimeType: string
      name: string
      size: number
    }
    jeunesIds: string[]
  }

  export interface Repository {
    save(fichier: Fichier): Promise<void>
    getFichierMetadata(idFichier: string): Promise<FichierMetadata | undefined>
  }

  @Injectable()
  export class Factory {
    constructor(
      private idService: IdService,
      private dateService: DateService
    ) {}

    creer(fichierACreer: Fichier.ACreer): Result<Fichier> {
      const fichier: Fichier = {
        id: this.idService.uuid(),
        buffer: fichierACreer.file.buffer,
        mimeType: fichierACreer.file.mimeType,
        nom: fichierACreer.file.name,
        idsJeunes: fichierACreer.jeunesIds,
        dateCreation: this.dateService.nowJs(),
        taille: fichierACreer.file.size
      }
      return success(fichier)
    }
  }
}
