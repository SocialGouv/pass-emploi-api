import { Action } from './action'

export namespace Milo {
  export interface Repository {
    save(action: Action): Promise<void>
  }
}
