import {
  DetailOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-models'
import { Result } from '../building-blocks/types/result'

export const OffresImmersionRepositoryToken = 'OffresImmersion.Repository'

export namespace OffresImmersion {
  export interface Repository {
    findAll(
      rome: string,
      lat: number,
      lon: number
    ): Promise<Result<OffreImmersionQueryModel[]>>

    get(
      idOffreImmersion: string
    ): Promise<Result<DetailOffreImmersionQueryModel>>
  }

  export enum MethodeDeContact {
    INCONNU = 'INCONNU',
    EMAIL = 'EMAIL',
    TELEPHONE = 'TELEPHONE',
    PRESENTIEL = 'PRESENTIEL'
  }
}
