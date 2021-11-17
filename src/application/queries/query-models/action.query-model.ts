import { Action } from '../../../domain/action'

export interface ActionQueryModel {
  id: string
  content: string
  comment: string
  creationDate: string
  lastUpdate: string
  status: Action.Statut
  creatorType: Action.TypeCreateur
  creator: string
  jeune?: {
    id: string
    firstName: string
    lastName: string
  }
}
