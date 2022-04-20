import { AgenceQueryModel } from '../application/queries/query-models/agence.query-models'

export const AgenceRepositoryToken = 'Agence.Repository'

export namespace Agence {
  export interface Repository {
    getAllQueryModelsByStructure(structure: string): Promise<AgenceQueryModel[]>
  }
}
