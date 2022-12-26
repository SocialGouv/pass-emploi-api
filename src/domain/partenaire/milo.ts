import { Result } from '../../building-blocks/types/result'

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
  }
}
