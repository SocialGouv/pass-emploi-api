import { DateTime } from 'luxon'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-models'
import {
  DetailJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-models'
import { Brand } from '../building-blocks/types/brand'
import { DateService } from '../utils/date-service'
import { Conseiller } from './conseiller'
import { Core } from './core'

export const JeunesRepositoryToken = 'Jeune.Repository'

export interface Jeune {
  id: string
  firstName: string
  lastName: string
  creationDate: DateTime
  conseiller: Conseiller
  structure: Core.Structure
  email?: string
  pushNotificationToken?: string
  tokenLastUpdate?: DateTime
}

export namespace Jeune {
  export type Id = Brand<string, 'JeuneId'>

  export interface Repository {
    get(id: string): Promise<Jeune | undefined>
    getByEmail(email: string): Promise<Jeune | undefined>
    save(jeune: Jeune): Promise<void>

    getResumeActionsDesJeunesDuConseiller(
      idConseiller: Conseiller.Id
    ): Promise<ResumeActionsDuJeuneQueryModel[]>
    getHomeQueryModel(idJeune: string): Promise<JeuneHomeQueryModel>
    getQueryModelById(
      idJeune: string
    ): Promise<DetailJeuneQueryModel | undefined>
    getAllQueryModelsByConseiller(
      idConseiller: Conseiller.Id
    ): Promise<DetailJeuneQueryModel[]>
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
