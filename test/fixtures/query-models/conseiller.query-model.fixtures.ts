import { ConseillerEtSesJeunesQueryModel } from '../../../src/domain/conseiller'

export function unConseillerEtSesJeunesQueryModel(
  args: Partial<ConseillerEtSesJeunesQueryModel> = {}
): ConseillerEtSesJeunesQueryModel {
  const defaults: ConseillerEtSesJeunesQueryModel = {
    conseiller: {
      id: '1',
      firstName: 'Nils',
      lastName: 'Tavernier'
    },
    jeunes: [
      {
        id: 'ABCDE',
        firstName: 'John',
        lastName: 'Doe',
        creationDate: '2021-11-11T08:03:30.000Z'
      }
    ]
  }

  return { ...defaults, ...args }
}
