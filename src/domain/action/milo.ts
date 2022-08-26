import { Action } from './action'
import { Authentification } from '../authentification'
import { Result } from '../../building-blocks/types/result'

export namespace Milo {
  export interface Repository {
    save(
      action: Action,
      utilisateur: Authentification.Utilisateur
    ): Promise<Result>
  }
}
