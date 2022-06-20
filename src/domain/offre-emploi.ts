import { DateTime } from 'luxon'

export interface OffreEmploi {
  id: string
  titre: string
  typeContrat: string
  nomEntreprise?: string
  localisation?: Localisation
  alternance?: boolean
  duree?: string
}

export interface Localisation {
  nom?: string
  codePostal?: string
  commune?: string
}

export const OffresEmploiRepositoryToken = 'OffresEmploi.Repository'

export namespace OffresEmploi {
  export const DISTANCE_PAR_DEFAUT = 10

  export interface Repository {
    saveAsFavori(idJeune: string, offreEmploi: OffreEmploi): Promise<void>

    getFavori(
      idJeune: string,
      idOffreEmploi: string
    ): Promise<OffreEmploi | undefined>

    deleteFavori(idJeune: string, idOffreEmploi: string): Promise<void>
  }

  export interface Criteres {
    page: number
    limit: number
    q?: string
    departement?: string
    alternance?: boolean
    experience?: Experience[]
    debutantAccepte?: boolean
    contrat?: Contrat[]
    duree?: Duree[]
    rayon?: number
    commune?: string
    minDateCreation?: DateTime
  }
}

export enum Contrat {
  cdi = 'CDI',
  cdd = 'CDD-interim-saisonnier',
  autre = 'autre'
}

export enum Experience {
  moinsdUnAn = '1',
  entreUnEtTroisAns = '2',
  plusDeTroisAns = '3'
}

export enum Duree {
  tempsPlein = '1',
  tempsPartiel = '2'
}
