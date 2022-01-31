import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { Result } from '../building-blocks/types/result'
import { Core } from './core'

export interface Conseiller {
  id: string
  firstName: string
  lastName: string
  email?: string
}

export const ConseillersRepositoryToken = 'Conseiller.Repository'

export namespace Conseiller {
  export interface Repository {
    get(id: string): Promise<Conseiller | undefined>
    getAllIds(): Promise<string[]>
    getQueryModelById(
      id: string
    ): Promise<DetailConseillerQueryModel | undefined>
    getQueryModelByEmailAndStructure(
      emailConseiller: string,
      structure: Core.Structure
    ): Promise<Result<DetailConseillerQueryModel>>

    // TODO ça a rien à faire dans le repo ça
    envoyerUnRappelParMail(
      idConseiller: string,
      nombreDeConversationNonLues: number
    ): Promise<void>
  }
}
