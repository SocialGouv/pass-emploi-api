import { Result } from '../building-blocks/types/result'

export const SuperviseursRepositoryToken = 'SuperviseursRepositoryToken'

export namespace Superviseur {
  export interface Repository {
    saveSuperviseurs(emails: string[]): Promise<Result>
    deleteSuperviseurs(emails: string[]): Promise<Result>
  }
}
