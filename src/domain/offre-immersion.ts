import {
  DetailOffreImmersionQueryModel,
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-models'
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
  export interface Repository {
    findAll(
      rome: string,
      lat: number,
      lon: number
    ): Promise<Result<OffreImmersionQueryModel[]>>

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

  export enum MethodeDeContact {
    INCONNU = 'INCONNU',
    EMAIL = 'EMAIL',
    TELEPHONE = 'TELEPHONE',
    PRESENTIEL = 'PRESENTIEL'
  }
}
