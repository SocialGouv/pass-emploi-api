import { ActionQueryModel } from '../../../../src/application/queries/query-models/actions.query-model'
import { Action } from '../../../../src/domain/action'

export class ActionFakeRepository implements Action.Repository {
  private readonly actions: Action[] = []

  get(id: Action.Id): Promise<Action | undefined> {
    return Promise.resolve(this.actions.find(action => action.id === id))
  }

  save(action: Action): Promise<void> {
    const index = this.actions.findIndex(action => action.id === action.id)
    if (index > -1) {
      this.actions[index] = action
    } else {
      this.actions.push(action)
    }
    return Promise.resolve()
  }

  getQueryModelById(idAction: string): Promise<ActionQueryModel | undefined> {
    throw new Error(`Not implemented - Cannot getQueryModelById ${idAction}`)
  }

  getQueryModelByJeuneId(id: string): Promise<ActionQueryModel[]> {
    throw new Error(`Not implemented - Cannot getQueryModelByJeuneId ${id}`)
  }

  delete(id: Action.Id): Promise<void> {
    throw new Error(`Not implemented - Cannot delete ${id}`)
  }
}
