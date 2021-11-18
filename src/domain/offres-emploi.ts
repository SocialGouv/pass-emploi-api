export interface OffreEmploiQueryModel {
  id: string
  data: unknown
  urlRedirectPourPostulation: string | null
}

interface OffreEmploiListItem {
  id: string
  titre: string
  typeContrat: string
  nomEntreprise?: string
  localisation?: unknown
  alternance?: boolean
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
      query?: string,
      departement?: string,
      alternance?: string
    ): Promise<OffresEmploiQueryModel>

    getOffreEmploiQueryModelById(
      idOffreEmploi: string
    ): Promise<OffreEmploiQueryModel | undefined>
  }
}
