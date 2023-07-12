import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from '../../utils/date-service'

export const SessionMiloRepositoryToken = 'SessionMilo.Repository'

export interface SessionMilo {
  id: string
  estVisible: boolean
  idStructureMilo: string
  dateModification: DateTime
}

export namespace SessionMilo {
  export interface Repository {
    save(session: SessionMilo): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(private dateService: DateService) {}

    mettreAJour(
      idSession: string,
      estVisible: boolean,
      idStructureMilo: string
    ): SessionMilo {
      return {
        id: idSession,
        estVisible,
        idStructureMilo,
        dateModification: this.dateService.now()
      }
    }
  }

  export namespace Inscription {
    export enum Statut {
      INSCRIT = 'INSCRIT',
      REFUS_JEUNE = 'REFUS_JEUNE',
      REFUS_TIERS = 'REFUS_TIERS'
    }
  }
}
