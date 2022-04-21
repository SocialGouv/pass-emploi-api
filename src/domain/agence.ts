import { AgenceQueryModel } from '../application/queries/query-models/agence.query-models'

export const AgenceRepositoryToken = 'Agence.Repository'

export interface Agence {
  id?: string
  nom?: string
}

export namespace Agence {
  export interface Repository {
    getAllQueryModelsByStructure(structure: string): Promise<AgenceQueryModel[]>
    get(id: string): Promise<Agence | undefined>
  }
}
