import { DateTime } from 'luxon'
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
    existe(idConseiller: string, structure: Core.Structure): Promise<boolean>
    findConseillersMessagesNonVerifies(
      nombreConseillers: number,
      dateVerification: DateTime
    ): Promise<Conseiller[]>
    save(conseiller: Conseiller): Promise<void>
  }
}
