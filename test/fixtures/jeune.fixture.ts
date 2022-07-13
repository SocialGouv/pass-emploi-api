import { Core } from '../../src/domain/core'
import { Jeune } from '../../src/domain/jeune'
import { unConseiller } from './conseiller.fixture'
import { uneDatetime } from './date.fixture'

export const unJeune = (
  args: Partial<Jeune> = {}
): Required<Omit<Jeune, 'tokenLastUpdate' | 'conseillerInitial'>> => {
  const defaults = {
    id: 'ABCDE',
    lastName: 'Doe',
    firstName: 'John',
    pushNotificationToken: 'unToken',
    isActivated: true,
    conseiller: unConseillerDuJeune(),
    creationDate: uneDatetime,
    email: 'john.doe@plop.io',
    idDossier: '1234',
    structure: Core.Structure.MILO,
    preferences: {
      partageFavoris: true
    }
  }

  return { ...defaults, ...args }
}

export const unJeuneSansPushNotificationToken = (
  conseiller = unConseiller()
): Omit<Jeune, 'tokenLastUpdate' | 'conseillerInitial'> => ({
  id: 'ABCDE',
  lastName: 'Doe',
  firstName: 'John',
  pushNotificationToken: '',
  isActivated: false,
  conseiller: unConseillerDuJeune(conseiller),
  creationDate: uneDatetime,
  email: 'john.doe@plop.io',
  idDossier: '1234',
  structure: Core.Structure.MILO,
  preferences: {
    partageFavoris: true
  }
})

export const unJeuneSansConseiller = (
  args: Partial<Omit<Jeune, 'conseiller' | 'conseillerInitial'>> = {}
): Omit<Jeune, 'conseiller' | 'conseillerInitial'> => {
  const defaults = {
    id: 'ABCDE',
    lastName: 'Doe',
    firstName: 'John',
    pushNotificationToken: 'unToken',
    isActivated: true,
    creationDate: uneDatetime,
    tokenLastUpdate: uneDatetime,
    email: 'john.doe@plop.io',
    idDossier: '1234',
    structure: Core.Structure.MILO,
    preferences: {
      partageFavoris: true
    }
  }

  return { ...defaults, ...args }
}

export const unConseillerDuJeune = (
  args: Partial<Jeune.Conseiller> = {}
): Jeune.Conseiller => {
  const conseiller = unConseiller()
  const defaults = {
    id: conseiller.id,
    firstName: conseiller.firstName,
    lastName: conseiller.lastName,
    email: conseiller.email
  }
  return { ...defaults, ...args }
}
