import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-model'

export function detailConseillerQueryModel(
  args: Partial<DetailConseillerQueryModel> = {}
): DetailConseillerQueryModel {
  const defaults: DetailConseillerQueryModel = {
    id: '1',
    firstName: 'Nils',
    lastName: 'Tavernier',
    notificationsSonores: false
  }

  return { ...defaults, ...args }
}
