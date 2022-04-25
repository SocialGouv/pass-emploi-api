import { DateTime } from 'luxon'
import { Core } from './core'
import { Agence } from './agence'
import { Injectable } from '@nestjs/common'
import { AgenceInput } from '../infrastructure/routes/validation/agences.inputs'

export interface Conseiller {
  id: string
  firstName: string
  lastName: string
  structure: Core.Structure
  email?: string
  dateVerificationMessages?: DateTime
  agence?: Agence
  nomAgenceManuel?: string
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

  @Injectable()
  export class Factory {
    ajoutAgenceAUnConseiller(
      actuel: Conseiller,
      agence?: AgenceInput
    ): Conseiller {
      return {
        id: actuel.id,
        firstName: actuel.firstName,
        lastName: actuel.lastName,
        structure: actuel.structure,
        email: actuel.email,
        dateVerificationMessages: actuel.dateVerificationMessages,
        agence: agence ?? actuel.agence
      }
    }
  }
}
