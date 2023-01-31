import { Action } from '../../src/domain/action/action'
import { uneDate, uneDatetime } from './date.fixture'
import { DateTime } from 'luxon'
import { ActionMilo } from '../../src/domain/action/action.milo'

export const uneAction = (args: Partial<Action> = {}): Action => {
  const now = uneDatetime()
  const defaults: Action = {
    id: '721e2108-60f5-4a75-b102-04fe6a40e899',
    statut: Action.Statut.PAS_COMMENCEE,
    idJeune: 'ABCDE',
    contenu: "Contenu de l'action",
    description: "Commentaire de l'action",
    dateDerniereActualisation: now,
    dateCreation: now,
    createur: {
      id: '1',
      type: Action.TypeCreateur.CONSEILLER,
      prenom: 'Nils',
      nom: 'Tavernier'
    },
    dateEcheance: DateTime.fromISO('2020-02-02'),
    dateDebut: undefined,
    dateFinReelle: undefined,
    rappel: true,
    qualification: undefined
  }

  return { ...defaults, ...args }
}

export const uneActionTerminee = (
  args: Partial<Action> = {}
): Action.Terminee => {
  const defaults: Action.Terminee = {
    ...uneAction(),
    dateFinReelle: DateTime.fromJSDate(uneDate()),
    statut: Action.Statut.TERMINEE
  }

  return { ...defaults, ...args }
}

export const uneActionQualifiee = (
  args: Partial<Action> = {}
): Action.Qualifiee => {
  const defaults: Action.Qualifiee = {
    ...uneAction(),
    dateDebut: DateTime.fromJSDate(uneDate()),
    dateFinReelle: DateTime.fromJSDate(uneDate()),
    qualification: {
      code: Action.Qualification.Code.SANTE,
      heures: 3,
      commentaire: 'Un commentaire'
    }
  }

  return { ...defaults, ...args }
}

export const uneActionMilo = (args: Partial<Action> = {}): ActionMilo => {
  const defaults: ActionMilo = {
    ...uneActionQualifiee(),
    idDossier: 'idDossier',
    loginConseiller: 'loginConseiller'
  }

  return { ...defaults, ...args }
}

export const unCommentaire = (
  args: Partial<Action.Commentaire> = {}
): Action.Commentaire => {
  const defaults: Action.Commentaire = {
    id: '1603e22a-27b4-11ed-a261-0242ac120002',
    idAction: '721e2108-60f5-4a75-b102-04fe6a40e899',
    date: uneDatetime(),
    createur: {
      id: 'poi-id-createur',
      nom: 'poi-nom',
      prenom: 'poi-prenom',
      type: Action.TypeCreateur.CONSEILLER
    },
    message: 'un premier commentaire'
  }

  return { ...defaults, ...args }
}
