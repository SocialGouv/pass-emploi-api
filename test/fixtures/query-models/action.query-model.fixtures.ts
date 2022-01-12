import { DateTime } from 'luxon'
import { ActionQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { Action } from '../../../src/domain/action'
import { Jeune } from '../../../src/domain/jeune'
import { uneAction } from '../action.fixture'
import { unJeune } from '../jeune.fixture'

export const uneActionQueryModelFromDomain = (
  action: Action = uneAction()
): ActionQueryModel => ({
  id: action.id,
  content: action.contenu,
  comment: action.commentaire,
  status: action.statut,
  creationDate: DateTime.fromJSDate(action.dateCreation)
    .toUTC()
    .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
  lastUpdate: DateTime.fromJSDate(action.dateDerniereActualisation)
    .toUTC()
    .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
  creator: 'Nils Tavernier',
  creatorType: Action.TypeCreateur.CONSEILLER
})

export const uneActionQueryModelWithJeuneFromDomain = (
  action: Action = uneAction(),
  jeune: Jeune = unJeune()
): ActionQueryModel => ({
  ...uneActionQueryModelFromDomain(action),
  jeune: {
    id: action.idJeune,
    firstName: jeune.firstName,
    lastName: jeune.lastName,
    email: jeune.email,
    creationDate: jeune.creationDate.toString(),
    isActivated: false
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
      email: 'damien.saez@email.fr',
      creationDate: '2021-11-10T08:03:30.000Z',
      isActivated: true
    },
    creatorType: Action.TypeCreateur.CONSEILLER,
    creator: 'Nils Tavernier'
  }

  return { ...defaults, ...args }
}
