import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { Brand } from '../building-blocks/types/brand'

export interface Conseiller {
  id: Conseiller.Id
  firstName: string
  lastName: string
}

export const ConseillersRepositoryToken = 'Conseiller.Repository'

export namespace Conseiller {
  export type Id = Brand<string, 'IdConseiller'>

  export interface Repository {
    get(id: Conseiller.Id): Promise<Conseiller | undefined>
    getQueryModelById(
      id: Conseiller.Id
    ): Promise<DetailConseillerQueryModel | undefined>
  }
}
