import { Conseiller } from '../../src/domain/conseiller/conseiller'
import { Core } from '../../src/domain/core'

export const unConseiller = (args: Partial<Conseiller> = {}): Conseiller => {
  const defaults: Conseiller = {
    id: '1',
    lastName: 'Tavernier',
    firstName: 'Nils',
    structure: Core.Structure.POLE_EMPLOI,
    email: 'nils.tavernier@passemploi.com',
    notificationsSonores: false
  }
  return { ...defaults, ...args }
}
