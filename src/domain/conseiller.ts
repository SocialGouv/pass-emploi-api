import { Brand } from '../building-blocks/types/brand'
import { Jeune } from './jeune'

export interface Conseiller {
  id: Conseiller.Id
  firstName: string
  lastName: string
}

export const ConseillersRepositoryToken = 'Conseiller.Repository'

export namespace Conseiller {
  export type Id = Brand<string, 'IdConseiller'>

  export interface Repository {
    get(id: Conseiller.Id): Promise<Conseiller>
    getAvecJeunes(
      id: Conseiller.Id
    ): Promise<ConseillerEtSesJeunesQueryModel | undefined>
  }
}

export interface ConseillerEtSesJeunesQueryModel {
  conseiller: {
    id: Conseiller.Id
    firstName: string
    lastName: string
  }
  jeunes: Array<{
    id: Jeune.Id
    firstName: string
    lastName: string
    creationDate: string
  }>
}
