import { Localisation } from 'src/domain/offre-emploi'

export interface OffreEmploiQueryModel {
  id: string
  data: unknown
  urlRedirectPourPostulation: string | null
}

export interface OffreEmploiResumeQueryModel {
  id: string
  titre: string
  typeContrat: string
  nomEntreprise?: string
  localisation?: Localisation
  alternance?: boolean
  duree?: string
}

interface Pagination {
  page: number
  limit: number
}

export interface OffresEmploiQueryModel {
  pagination: Pagination
  results: OffreEmploiResumeQueryModel[]
}

export interface FavoriIdQueryModel {
  id: string
}
