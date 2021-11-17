import { DateTime } from 'luxon'
import { ActionQueryModel } from '../../../src/application/queries/query-models/action.query-model'
import { Action } from '../../../src/domain/action'
import { Jeune } from '../../../src/domain/jeune'
import { uneAction } from '../action.fixture'
import { unJeune } from '../jeune.fixture'

export const uneActionQueryModelFromDomain = (
  action: Action = uneAction(),
  jeune: Jeune = unJeune()
): ActionQueryModel => ({
  id: action.id,
  content: action.contenu,
  comment: action.commentaire,
  status: action.statut,
  jeune: {
    id: action.idJeune,
    firstName: jeune.firstName,
    lastName: jeune.lastName
  },
  creationDate: DateTime.fromJSDate(action.dateCreation)
    .toUTC()
    .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
  lastUpdate: DateTime.fromJSDate(action.dateDerniereActualisation)
    .toUTC()
    .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
  creator: 'John Doe',
  creatorType: Action.TypeCreateur.CONSEILLER
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
      lastName: 'Saez'
    },
    creatorType: Action.TypeCreateur.CONSEILLER,
    creator: 'Nils Tavernier'
  }

  return { ...defaults, ...args }
}
