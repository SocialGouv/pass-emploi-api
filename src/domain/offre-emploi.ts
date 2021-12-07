import {
  FavoriIdQueryModel,
  OffreEmploiResumeQueryModel,
  OffreEmploiQueryModel,
  OffresEmploiQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import { Jeune } from './jeune'

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
  nom: string
  codePostal?: string
  commune?: string
}

export const OffresEmploiRepositoryToken = 'OffresEmploi.Repository'

export namespace OffresEmploi {
  export interface Repository {
    findAll(
      page: number,
      limit: number,
      alternance?: boolean,
      query?: string,
      departement?: string,
      experience?: Experience[],
      duree?: Duree[],
      contrat?: Contrat[]
    ): Promise<OffresEmploiQueryModel>

    getOffreEmploiQueryModelById(
      idOffreEmploi: string
    ): Promise<OffreEmploiQueryModel | undefined>

    getFavorisIdsQueryModelsByJeune(id: Jeune.Id): Promise<FavoriIdQueryModel[]>

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
}

export enum Contrat {
  cdi = 'CDI',
  cdd = 'CDD',
  interim = 'interim',
  saisonnier = 'saisonnier',
  autre = 'autre'
}

export enum Experience {
  moinsdUnAn = '1',
  entreUnEtTroisAns = '2',
  plusDeTroisAns = '3'
}

export enum Duree {
  nonPrecise = '0',
  tempsPlein = '1',
  tempsPartiel = '2'
}
