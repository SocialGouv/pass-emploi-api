import { DateTime } from 'luxon'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../building-blocks/types/result'
import { Agence } from '../agence'
import { Core } from '../core'
import * as _ListeDeDiffusion from './liste-de-diffusion'
import Structure = Core.Structure

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import ListeDeDiffusion = _ListeDeDiffusion.ListeDeDiffusion

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

  export function modifierEtablissement(
    conseiller: Conseiller,
    agence: Agence
  ): Conseiller {
    return {
      ...conseiller,
      agence
    }
  }

  export function mettreAJour(
    conseiller: Conseiller,
    infosDeMiseAJour: InfosDeMiseAJour
  ): Result<Conseiller> {
    const conseilleMiloARenseigneUneAgenceManuelle =
      conseiller.structure === Structure.MILO && !infosDeMiseAJour.agence?.id

    if (conseilleMiloARenseigneUneAgenceManuelle) {
      return failure(
        new MauvaiseCommandeError(
          'Un conseiller MILO doit choisir une Agence du référentiel'
        )
      )
    }

    if (
      conseiller.agence?.id &&
      infosDeMiseAJour.agence?.id &&
      conseiller.agence.id !== infosDeMiseAJour.agence.id
    ) {
      return failure(
        new MauvaiseCommandeError('Un conseiller ne peut pas changer d’agence')
      )
    }

    return success({
      ...conseiller,
      agence: infosDeMiseAJour.agence,
      notificationsSonores: Boolean(infosDeMiseAJour.notificationsSonores)
    })
  }

  export interface InfosDeMiseAJour {
    agence?: Agence
    notificationsSonores?: boolean
  }
}
