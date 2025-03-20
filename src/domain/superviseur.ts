import { Result } from '../building-blocks/types/result'
import { Core } from './core'

export const SuperviseursRepositoryToken = 'SuperviseursRepositoryToken'

export interface Superviseur {
  email: string
  structure: Core.Structure
}

export namespace Superviseur {
  export interface Repository {
    saveSuperviseurs(superviseurs: Superviseur[]): Promise<Result>
    deleteSuperviseurs(emails: string[]): Promise<Result>
  }
}
