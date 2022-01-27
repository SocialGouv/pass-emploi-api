import { Core } from '../../src/domain/core'
import { Jeune } from '../../src/domain/jeune'
import { unConseiller } from './conseiller.fixture'
import { uneDatetime } from './date.fixture'

export const unJeune = (
  args: Partial<Jeune> = {},
  conseiller = unConseiller()
): Required<Omit<Jeune, 'tokenLastUpdate'>> => {
  const defaults = {
    id: 'ABCDE',
    lastName: 'Doe',
    firstName: 'John',
    pushNotificationToken: 'unToken',
    conseiller,
    creationDate: uneDatetime,
    email: 'john.doe@plop.io',
    structure: Core.Structure.MILO
  }

  return { ...defaults, ...args }
}

export const unJeuneSansPushNotificationToken = (
  conseiller = unConseiller()
): Required<Omit<Jeune, 'tokenLastUpdate'>> => ({
  id: 'ABCDE',
  lastName: 'Doe',
  firstName: 'John',
  pushNotificationToken: '',
  conseiller,
  creationDate: uneDatetime,
  email: 'john.doe@plop.io',
  structure: Core.Structure.MILO
})
