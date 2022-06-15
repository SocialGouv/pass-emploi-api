import { DateTime } from 'luxon'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-model'
import { Brand } from '../building-blocks/types/brand'
import { DateService } from '../utils/date-service'
import { Core } from './core'

export const JeunesRepositoryToken = 'Jeune.Repository'

export interface Jeune {
  id: string
  firstName: string
  lastName: string
  creationDate: DateTime
  structure: Core.Structure
  isActivated: boolean
  conseiller?: Jeune.Conseiller
  conseillerInitial?: Jeune.ConseillerInitial
  email?: string
  pushNotificationToken?: string
  tokenLastUpdate?: DateTime
  idDossier?: string
}

export namespace Jeune {
  export interface Conseiller {
    id: string
    firstName: string
    lastName: string
    email?: string
  }

  export interface ConseillerInitial {
    id: string
  }

  export type Id = Brand<string, 'JeuneId'>

  export interface Repository {
    get(id: string): Promise<Jeune | undefined>

    getJeunesMilo(offset: number, limit: number): Promise<Jeune[]>

    existe(id: string): Promise<boolean>

    getByEmail(email: string): Promise<Jeune | undefined>

    getByIdDossier(idDossier: string): Promise<Jeune | undefined>

    save(jeune: Jeune): Promise<void>

    findAllJeunesByConseiller(
      idsJeunes: string[],
      idConseiller: string
    ): Promise<Jeune[]>

    supprimer(idJeune: Jeune.Id): Promise<void>

    getHomeQueryModel(idJeune: string): Promise<JeuneHomeQueryModel>

    transferAndSaveAll(
      jeunes: Jeune[],
      idConseillerCible: string,
      idConseillerSource: string,
      estTemporaire: boolean
    ): Promise<void>
  }

  export function updateToken(
    jeune: Jeune,
    newToken: string,
    dateService: DateService
  ): Jeune {
    return {
      ...jeune,
      pushNotificationToken: newToken,
      tokenLastUpdate: dateService.now()
    }
  }
}
