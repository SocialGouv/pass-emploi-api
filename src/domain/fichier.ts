import { Injectable } from '@nestjs/common'
import { Result, success } from '../building-blocks/types/result'
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
        buffer: fichierACreer.fichier.buffer,
        mimeType: fichierACreer.fichier.mimeType,
        nom: fichierACreer.fichier.name,
        idsJeunes: fichierACreer.jeunesIds,
        dateCreation: this.dateService.nowJs(),
        idCreateur: fichierACreer.createur.id,
        typeCreateur: fichierACreer.createur.type
      }
      return success(fichier)
    }
  }
}
