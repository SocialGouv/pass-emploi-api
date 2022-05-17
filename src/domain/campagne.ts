import { DateTime } from 'luxon'
import { Injectable } from '@nestjs/common'
import { IdService } from '../utils/id-service'

export const CampagneRepositoryToken = 'Campagne.Repository'

export interface Campagne {
  id: string
  nom: string
  dateDebut: DateTime
  dateFin: DateTime
}

export namespace Campagne {
  export interface ACreer {
    nom: string
    dateDebut: DateTime
    dateFin: DateTime
  }

  export interface Repository {
    save(campagne: Campagne): Promise<void>
    getByIntervalOrName(
      dateDebut: DateTime,
      dateFin: DateTime,
      nom: string
    ): Promise<Campagne | undefined>
  }

  @Injectable()
  export class Factory {
    constructor(private readonly idService: IdService) {}

    creer(campagneACreer: Campagne.ACreer): Campagne {
      return {
        ...campagneACreer,
        id: this.idService.uuid()
      }
    }
  }
}
