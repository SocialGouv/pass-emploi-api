import { AgenceQueryModel } from '../application/queries/query-models/agence.query-models'
import { Core } from './core'

export const AgenceRepositoryToken = 'Agence.Repository'

export interface Agence {
  id?: string
  nom?: string
}

export namespace Agence {
  import Structure = Core.Structure

  export interface Repository {
    getAllQueryModelsByStructure(structure: string): Promise<AgenceQueryModel[]>
    get(id: string): Promise<Agence | undefined>
    getStructureOfAgence(id: string): Promise<Structure | undefined>
  }
}
