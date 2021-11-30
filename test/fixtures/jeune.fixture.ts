import { Jeune } from '../../src/domain/jeune'
import { unConseiller } from './conseiller.fixture'
import { uneDatetime } from './date.fixture'

export const unJeune = (
  conseiller = unConseiller()
): Required<Omit<Jeune, 'tokenLastUpdate'>> => ({
  id: 'ABCDE',
  lastName: 'Doe',
  firstName: 'John',
  pushNotificationToken: 'unToken',
  conseiller,
  creationDate: uneDatetime
})

export const unJeuneSansPushNotificationToken = (
  conseiller = unConseiller()
): Required<Omit<Jeune, 'tokenLastUpdate'>> => ({
  id: 'ABCDE',
  lastName: 'Doe',
  firstName: 'John',
  pushNotificationToken: '',
  conseiller,
  creationDate: uneDatetime
})
