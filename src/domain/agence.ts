import { Core, estPoleEmploi } from './core'

export const AgenceRepositoryToken = 'Agence.Repository'

export interface Agence {
  id?: string
  nom?: string
}

export namespace Agence {
  import Structure = Core.Structure

  export interface Repository {
    get(id: string, structure: Structure): Promise<Agence | undefined>
  }

  export function getStructureDeReference(
    structure: Core.Structure
  ): Core.Structure {
    if (estPoleEmploi(structure)) {
      return Core.Structure.POLE_EMPLOI
    }
    return structure
  }
}
