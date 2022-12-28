import { Injectable } from '@nestjs/common'
import { unRendezVous } from '../../../test/fixtures/rendez-vous.fixture'
import { Result } from '../../building-blocks/types/result'
import { Jeune } from '../jeune/jeune'
import { RendezVous as RendezVousPassEmploi } from '../rendez-vous/rendez-vous'

export const PartenaireMiloRepositoryToken = 'PartenaireMiloRepositoryToken'

export namespace Milo {
  export interface Evenement {
    id: string
    idPartenaireBeneficiaire: string
    objet: ObjetEvenement
    type: TypeEvenement
    idObjet: string
    date: string
  }

  export interface RendezVous {
    id: string
    dateHeureDebut: string
    dateHeureFin?: string
    titre: string
    idPartenaireBeneficiaire: string
    commentaire?: string
    type?: string
    statut: string
  }

  export namespace RendezVous {
    @Injectable()
    export class Factory {
      creerRendezVousPassEmploi(
        _rendezVousMilo: RendezVous,
        _configJeune: Jeune.ConfigurationApplication
      ): RendezVousPassEmploi {
        return unRendezVous()
      }
    }
  }

  export enum ObjetEvenement {
    RENDEZ_VOUS = 'RENDEZ_VOUS',
    SESSION = 'SESSION',
    NON_TRAITABLE = 'NON_TRAITABLE'
  }
  export enum TypeEvenement {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    NON_TRAITABLE = 'NON_TRAITABLE'
  }

  export interface Repository {
    findAllEvenements(): Promise<Evenement[]>
    acquitterEvenement(evenement: Evenement): Promise<Result>
    findRendezVousByEvenement(
      evenement: Evenement
    ): Promise<RendezVous | undefined>
  }
}
