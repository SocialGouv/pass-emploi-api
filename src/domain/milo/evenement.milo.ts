import { Result } from '../../building-blocks/types/result'

export const EvenementMiloRepositoryToken = 'EvenementMiloRepositoryToken'

export interface EvenementMilo {
  id: string
  idPartenaireBeneficiaire: string
  action: EvenementMilo.ActionEvenement
  objet: EvenementMilo.ObjetEvenement
  idObjet: string | null
  date: string
}

export namespace EvenementMilo {
  export enum ObjetEvenement {
    RENDEZ_VOUS = 'RENDEZ_VOUS',
    SESSION = 'SESSION',
    NON_TRAITABLE = 'NON_TRAITABLE'
  }

  export enum ActionEvenement {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    NON_TRAITABLE = 'NON_TRAITABLE'
  }

  export interface Repository {
    findAllEvenements(): Promise<EvenementMilo[]>

    acquitterEvenement(evenement: EvenementMilo): Promise<Result>
  }
}
