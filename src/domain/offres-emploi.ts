export interface OffreEmploiQueryModel {
  id: string
  data: unknown
  urlRedirectPourPostulation: string | null
}

export interface OffreEmploiListItem {
  id: string
  titre: string
  typeContrat: string
  nomEntreprise?: string
  localisation?: {
    nom: string
    codePostal: string
    commune: string
  }
  alternance?: boolean
  duree?: string
}

interface Pagination {
  page: number
  limit: number
}

export interface OffresEmploiQueryModel {
  pagination: Pagination
  results: OffreEmploiListItem[]
}

export const OffresEmploiRepositoryToken = 'OffresEmploi.Repository'

export namespace OffresEmploi {
  export interface Repository {
    findAll(
      page: number,
      limit: number,
      alternance: boolean,
      query?: string,
      departement?: string
    ): Promise<OffresEmploiQueryModel>

    getOffreEmploiQueryModelById(
      idOffreEmploi: string
    ): Promise<OffreEmploiQueryModel | undefined>

    saveAsFavori(
      idJeune: string,
      offreEmploi: OffreEmploiListItem
    ): Promise<void>
  }
}
