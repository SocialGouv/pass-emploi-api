import { Core } from '../../src/domain/core'
import { Jeune } from '../../src/domain/jeune/jeune'
import { unConseiller } from './conseiller.fixture'
import { uneDate, uneDatetime } from './date.fixture'

export const unJeune = (
  args: Partial<Jeune> = {}
): Required<
  Omit<Jeune, 'conseillerInitial' | 'dateFinCEJ' | 'dateSignatureCGU'>
> => {
  const defaults: Required<
    Omit<Jeune, 'conseillerInitial' | 'dateFinCEJ' | 'dateSignatureCGU'>
  > = {
    id: 'ABCDE',
    lastName: 'Doe',
    firstName: 'John',
    isActivated: true,
    conseiller: unConseillerDuJeune(),
    creationDate: uneDatetime(),
    datePremiereConnexion: uneDatetime().plus({ day: 1 }),
    email: 'john.doe@plop.io',
    idPartenaire: '1234',
    structure: Core.Structure.MILO,
    configuration: uneConfiguration(),
    preferences: {
      partageFavoris: true,
      alertesOffres: true,
      messages: true,
      creationActionConseiller: true,
      rendezVousSessions: true,
      rappelActions: true
    }
  }

  return { ...defaults, ...args }
}

export const unJeuneSansPushNotificationToken = (
  conseiller = unConseiller()
): Omit<Jeune, 'conseillerInitial'> => ({
  id: 'ABCDE',
  lastName: 'Doe',
  firstName: 'John',
  isActivated: false,
  conseiller: unConseillerDuJeune(conseiller),
  creationDate: uneDatetime(),
  email: 'john.doe@plop.io',
  idPartenaire: '1234',
  structure: Core.Structure.MILO,
  configuration: {
    idJeune: 'ABCDE'
  },
  preferences: desPreferencesJeune()
})

export const unJeuneSansConseiller = (
  args: Partial<Omit<Jeune, 'conseiller' | 'conseillerInitial'>> = {}
): Omit<Jeune, 'conseiller' | 'conseillerInitial'> => {
  const defaults: Omit<Jeune, 'conseiller' | 'conseillerInitial'> = {
    id: 'ABCDE',
    lastName: 'Doe',
    firstName: 'John',
    isActivated: true,
    creationDate: uneDatetime(),
    datePremiereConnexion: uneDatetime().plus({ day: 1 }),
    email: 'john.doe@plop.io',
    idPartenaire: '1234',
    structure: Core.Structure.MILO,
    preferences: {
      partageFavoris: true,
      alertesOffres: true,
      messages: true,
      creationActionConseiller: true,
      rendezVousSessions: true,
      rappelActions: true
    },
    configuration: uneConfiguration()
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

export const uneConfiguration = (
  args: Partial<Jeune.ConfigurationApplication> = {}
): Jeune.ConfigurationApplication => {
  const defaults: Jeune.ConfigurationApplication = {
    idJeune: 'ABCDE',
    pushNotificationToken: 'token',
    dateDerniereActualisationToken: uneDate(),
    installationId: '123456',
    instanceId: 'abcdef',
    appVersion: '1.8.1',
    fuseauHoraire: 'Europe/Paris'
  }
  return { ...defaults, ...args }
}

export function desPreferencesJeune(
  args: Partial<Jeune.Preferences> = {}
): Jeune.Preferences {
  const defaults: Jeune.Preferences = {
    partageFavoris: true,
    alertesOffres: true,
    messages: true,
    creationActionConseiller: true,
    rendezVousSessions: true,
    rappelActions: true
  }

  return { ...defaults, ...args }
}
