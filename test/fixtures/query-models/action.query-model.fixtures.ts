import {
  ActionQueryModel,
  QualificationActionQueryModel
} from '../../../src/application/queries/query-models/actions.query-model'
import { Action } from '../../../src/domain/action/action'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { uneAction } from '../action.fixture'
import { unJeune } from '../jeune.fixture'
import { DateTime } from 'luxon'

export const uneActionQueryModelFromDomain = (
  action: Action = uneAction(),
  etat: Action.Qualification.Etat = Action.Qualification.Etat.NON_QUALIFIABLE,
  qualification: QualificationActionQueryModel | undefined = undefined
): ActionQueryModel => ({
  id: action.id,
  content: action.contenu,
  comment: action.description,
  status: action.statut,
  creationDate: action.dateCreation.toFormat('EEE, d MMM yyyy HH:mm:ss z'),
  lastUpdate: action.dateDerniereActualisation.toFormat(
    'EEE, d MMM yyyy HH:mm:ss z'
  ),
  creator: 'Nils Tavernier',
  creatorType: Action.TypeCreateur.CONSEILLER,
  dateEcheance: action.dateEcheance.toISO(),
  dateFinReelle: undefined,
  etat,
  qualification
})

export const uneActionQueryModelTermineeAvecQualification = (
  action: Action = uneAction(),
  jeune: Jeune = unJeune()
): ActionQueryModel => ({
  ...uneActionQueryModelFromDomain(action),
  status: Action.Statut.TERMINEE,
  jeune: {
    id: action.idJeune,
    firstName: jeune.firstName,
    lastName: jeune.lastName,
    idConseiller: jeune.conseiller!.id
  },
  dateFinReelle: action.dateFinReelle?.toISO(),
  etat: Action.Qualification.Etat.QUALIFIEE,
  qualification: {
    heures: 2,
    libelle: 'Santé',
    code: Action.Qualification.Code.SANTE,
    commentaireQualification: 'Un commentaire'
  }
})

export function uneActionQueryModel(
  args: Partial<ActionQueryModel> = {}
): ActionQueryModel {
  const defaults: ActionQueryModel = {
    id: '1',
    content: "Ceci est un contenu d'action",
    comment: 'Ceci est un commentaire',
    status: Action.Statut.EN_COURS,
    creationDate: '2021-11-11T08:03:30.000Z',
    lastUpdate: '2021-11-11T09:03:30.000Z',
    jeune: {
      id: '1',
      firstName: 'Damien',
      lastName: 'Saez',
      idConseiller: 'id-conseiller'
    },
    creatorType: Action.TypeCreateur.CONSEILLER,
    creator: 'Nils Tavernier',
    dateEcheance: '2021-11-11T10:03:30.000Z',
    etat: Action.Qualification.Etat.NON_QUALIFIABLE
  }

  return { ...defaults, ...args }
}

export function uneActionQueryModelSansJeune(
  args: Partial<ActionQueryModel> = {}
): ActionQueryModel {
  const defaults: ActionQueryModel = {
    comment: "Description de l'action",
    content: "Contenu de l'action",
    creationDate: DateTime.fromISO('2021-11-11T08:03:30.000Z').toFormat(
      'EEE, d MMM yyyy HH:mm:ss z'
    ),
    creator: 'Nils Tavernier',
    creatorType: Action.TypeCreateur.CONSEILLER,
    dateEcheance: '2021-11-11T08:03:30.000Z',
    dateFinReelle: undefined,
    id: 'd2e48a82-c664-455a-b3a5-bb0465a72022',
    lastUpdate: DateTime.fromISO('2021-11-11T08:03:30.000Z').toFormat(
      'EEE, d MMM yyyy HH:mm:ss z'
    ),
    status: Action.Statut.PAS_COMMENCEE,
    etat: Action.Qualification.Etat.NON_QUALIFIABLE,
    qualification: undefined
  }

  return { ...defaults, ...args }
}
