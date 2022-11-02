import { DateTime } from 'luxon'
import { Core } from './core'
import { Agence } from './agence'
import { Injectable } from '@nestjs/common'
import { failure, Result, success } from '../building-blocks/types/result'
import Structure = Core.Structure
import { DroitsInsuffisants } from '../building-blocks/types/domain-error'

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

  @Injectable()
  export class Factory {
    mettreAJour(
      conseiller: Conseiller,
      infosDeMiseAJour: InfosDeMiseAJour
    ): Result<Conseiller> {
      const conseilleMiloARenseigneUneAgenceManuelle =
        conseiller.structure === Structure.MILO && !infosDeMiseAJour.agence?.id

      if (conseilleMiloARenseigneUneAgenceManuelle) {
        return failure(new DroitsInsuffisants())
      }
      return success({
        ...conseiller,
        agence: infosDeMiseAJour.agence,
        notificationsSonores: Boolean(infosDeMiseAJour.notificationsSonores)
      })
    }
  }

  export interface InfosDeMiseAJour {
    agence?: Agence
    notificationsSonores?: boolean
  }
}
