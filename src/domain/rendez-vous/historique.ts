import { Injectable } from '@nestjs/common'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Authentification } from '../authentification'

export const HistoriqueRendezVousRepositoryToken = 'Historique.Repository'

export namespace Historique {
  export interface LogModification {
    id: string
    idRendezVous: string
    date: Date
    auteur: {
      id: string
      nom: string
      prenom: string
    }
  }

  export interface Repository {
    save(logModification: LogModification): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(
      private readonly idService: IdService,
      private readonly dateService: DateService
    ) {}

    creerLogModification(
      idRendezVous: string,
      utilisateur: Authentification.Utilisateur
    ): LogModification {
      return {
        id: this.idService.uuid(),
        idRendezVous,
        date: this.dateService.nowJs(),
        auteur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom
        }
      }
    }
  }
}
