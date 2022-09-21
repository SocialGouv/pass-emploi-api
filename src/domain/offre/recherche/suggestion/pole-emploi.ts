import { Result } from '../../../../building-blocks/types/result'

export interface PoleEmploi {
  texteRecherche?: string
  rome: string
  localisation: {
    code: string
    type: 'COMMUNE' | 'DEPARTEMENT'
    rayon?: number
  }
  informations: {
    titre: string
    metier: string
    localisation: string
  }
}

export namespace PoleEmploi {
  export interface Repository {
    findAll(token: string): Promise<Result<PoleEmploi[]>>
  }
}
