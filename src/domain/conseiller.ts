import { DateTime } from 'luxon'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { Result } from '../building-blocks/types/result'
import { Core } from './core'

export interface Conseiller {
  id: string
  firstName: string
  lastName: string
  structure: Core.Structure
  email?: string
  dateVerificationMessages?: DateTime
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
    existe(idConseiller: string, structure: Core.Structure): Promise<boolean>
    envoyerUnRappelParMail(
      idConseiller: string,
      nombreDeConversationNonLues: number
    ): Promise<void>
    findConseillersMessagesNonVerifies(
      nombreConseillers: number,
      dateVerification: DateTime
    ): Promise<Conseiller[]>
    save(conseiller: Conseiller): Promise<void>
  }
}
