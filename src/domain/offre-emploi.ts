import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel,
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import { Jeune } from './jeune'
import { Result } from '../building-blocks/types/result'
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
  export interface Repository {
    findAll(criteres: Criteres): Promise<Result<OffresEmploiQueryModel>>

    getOffreEmploiQueryModelById(
      idOffreEmploi: string
    ): Promise<OffreEmploiQueryModel | undefined>

    getFavorisIdsQueryModelsByJeune(
      id: Jeune.Id
    ): Promise<FavoriOffreEmploiIdQueryModel[]>

    getFavorisQueryModelsByJeune(
      id: Jeune.Id
    ): Promise<OffreEmploiResumeQueryModel[]>

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
