import {
  DetailOffreImmersionQueryModel,
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-model'
import { Result } from '../building-blocks/types/result'
import { Jeune } from './jeune'

export const OffresImmersionRepositoryToken = 'OffresImmersion.Repository'

export interface OffreImmersion {
  id: string
  metier: string
  nomEtablissement: string
  secteurActivite: string
  ville: string
}

export namespace OffresImmersion {
  export const DISTANCE_PAR_DEFAUT = 10

  export interface Repository {
    findAll(criteres: Criteres): Promise<Result<OffreImmersionQueryModel[]>>

    getFavorisIdsQueryModelsByJeune(
      id: Jeune.Id
    ): Promise<FavoriOffreImmersionIdQueryModel[]>

    getFavorisQueryModelsByJeune(
      id: Jeune.Id
    ): Promise<OffreImmersionQueryModel[]>

    get(
      idOffreImmersion: string
    ): Promise<Result<DetailOffreImmersionQueryModel>>

    getFavori(
      idJeune: string,
      idOffreImmersion: string
    ): Promise<OffreImmersion | undefined>

    saveAsFavori(idJeune: string, offreImmersion: OffreImmersion): Promise<void>

    deleteFavori(idJeune: string, idOffreImmersion: string): Promise<void>
  }

  export interface Criteres {
    rome: string
    lat: number
    lon: number
    distance: number
  }

  export enum MethodeDeContact {
    INCONNU = 'INCONNU',
    EMAIL = 'EMAIL',
    TELEPHONE = 'TELEPHONE',
    PRESENTIEL = 'PRESENTIEL'
  }
}
