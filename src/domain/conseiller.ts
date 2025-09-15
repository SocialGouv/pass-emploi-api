import { DateTime } from 'luxon'
import { MauvaiseCommandeError } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { Agence } from './agence'
import { Core } from './core'
import * as _ListeDeDiffusion from './milo/liste-de-diffusion'
import * as _Conseiller from './milo/conseiller.milo.db'
import Structure = Core.Structure

export interface Conseiller {
  id: string
  firstName: string
  lastName: string
  structure: Core.Structure
  email?: string
  dateVerificationMessages?: DateTime
  dateSignatureCGU?: DateTime
  dateVisionnageActus?: DateTime
  agence?: Agence
  notificationsSonores: boolean
}

export const ConseillerRepositoryToken = 'ConseillerRepositoryToken'

export namespace Conseiller {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import Milo = _Conseiller.ConseillerMilo
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export import ListeDeDiffusion = _ListeDeDiffusion.ListeDeDiffusion

  export interface Repository {
    get(id: string): Promise<Conseiller | undefined>

    getByIdAuthentification(
      idAuthentification: string
    ): Promise<Conseiller | undefined>

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

    delete(idConseiller: string): Promise<void>
  }

  export function modifierAgence(
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
      conseiller.structure === Structure.MILO &&
      infosDeMiseAJour.agence &&
      !infosDeMiseAJour.agence.id

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
      notificationsSonores: Boolean(infosDeMiseAJour.notificationsSonores),
      dateSignatureCGU: infosDeMiseAJour.dateSignatureCGU,
      dateVisionnageActus: infosDeMiseAJour.dateVisionnageActus
    })
  }

  export interface InfosDeMiseAJour {
    agence?: Agence
    dateSignatureCGU?: DateTime
    dateVisionnageActus?: DateTime
    notificationsSonores?: boolean
  }
}
