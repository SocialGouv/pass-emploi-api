import { Result } from '../../../../building-blocks/types/result'

export interface PoleEmploi {
  titreMetier?: string
  categorieMetier?: string
  codeRome?: string
  texteRecherche?: string
  localisation: {
    libelle: string
    code: string
    type: 'COMMUNE' | 'DEPARTEMENT'
    rayon?: number
    lat?: number
    lon?: number
  }
}

export namespace PoleEmploi {
  export interface Repository {
    findAll(token: string): Promise<Result<PoleEmploi[]>>
  }
}
