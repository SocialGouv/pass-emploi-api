import { DateTime } from 'luxon'
import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import { Brand } from '../building-blocks/types/brand'
import { DateService } from '../utils/date-service'
import { Action } from './action'
import { Conseiller } from './conseiller'

export const JeunesRepositoryToken = 'Jeune.Repository'

export interface Jeune {
  id: string
  firstName: string
  lastName: string
  creationDate: DateTime
  conseiller: Conseiller
  pushNotificationToken?: string
  tokenLastUpdate?: DateTime
}

export namespace Jeune {
  export type Id = Brand<string, 'JeuneId'>

  export interface Repository {
    get(id: string): Promise<Jeune | undefined>
    save(jeune: Jeune): Promise<void>
    getResumeActionsDesJeunesDuConseiller(
      idConseiller: Conseiller.Id
    ): Promise<ResumeActionsDuJeuneQueryModel[]>
    getHomeQueryModel(idJeune: string): Promise<JeuneHomeQueryModel>
    getQueryModelById(id: string): Promise<DetailJeuneQueryModel | undefined>
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

export interface JeuneHomeQueryModel {
  actions: ActionQueryModel[]
  doneActionsCount: number
  conseiller: Conseiller
  rendezvous: RendezVousQueryModel[]
}

interface ActionQueryModel {
  id: string
  content: string
  comment: string
  creationDate: string
  lastUpdate: string
  status: Action.Statut
  creator: string
  creatorType: Action.TypeCreateur
}

interface RendezVousQueryModel {
  id: string
  title: string
  subtitle: string
  comment: string
  modality?: string
  date: string
  duration: string
}

export interface ResumeActionsDuJeuneQueryModel {
  jeuneId: Jeune.Id
  jeuneFirstName: string
  jeuneLastName: string
  todoActionsCount: number
  doneActionsCount: number
  inProgressActionsCount: number
}
