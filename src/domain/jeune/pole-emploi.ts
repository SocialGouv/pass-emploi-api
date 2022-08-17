import { Jeune } from './jeune'

export interface PoleEmploi {
  id: string
  idAuthentification: string
  pushNotificationToken: string
}

export namespace PoleEmploi {
  export interface Repository {
    findAll(offset: number, limit: number): Promise<Jeune.PoleEmploi[]>
  }
}
