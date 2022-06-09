import { DateTime } from 'luxon'
import { Core } from './core'
import { Agence } from './agence'

export interface Conseiller {
  id: string
  firstName: string
  lastName: string
  structure: Core.Structure
  email?: string
  dateVerificationMessages?: DateTime
  agence?: Agence
  nomAgenceManuel?: string
  notificationsSonores: boolean
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

    updateDateVerificationMessages(
      idconseiller: string,
      dateVerification: Date
    ): Promise<void>
  }

  export function mettreAJour(
    conseiller: Conseiller,
    infosDeMiseAJour: InfoDeMiseAJour
  ): Conseiller {
    return {
      ...conseiller,
      agence: infosDeMiseAJour.agence,
      notificationsSonores: Boolean(infosDeMiseAJour.notificationsSonores)
    }
  }

  export interface InfoDeMiseAJour {
    agence?: Agence
    notificationsSonores?: boolean
  }
}
