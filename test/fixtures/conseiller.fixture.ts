import { Conseiller } from '../../src/domain/milo/conseiller'
import { Core } from '../../src/domain/core'
import { DateTime } from 'luxon'

export const unConseiller = (args: Partial<Conseiller> = {}): Conseiller => {
  const defaults: Conseiller = {
    id: '1',
    lastName: 'Tavernier',
    firstName: 'Nils',
    structure: Core.Structure.POLE_EMPLOI,
    email: 'nils.tavernier@passemploi.com',
    notificationsSonores: false,
    dateSignatureCGU: DateTime.fromISO('2023-10-03T12:00:00.000Z'),
    dateVisionnageActus: DateTime.fromISO('2023-10-03T12:00:00.000Z')
  }
  return { ...defaults, ...args }
}
