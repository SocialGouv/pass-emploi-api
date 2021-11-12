import { Action, ActionData } from '../../src/domain/action'
import { uneDatetime } from './date.fixture'

export const uneAction = (args: Partial<ActionData> = {}): Action => {
  const now = uneDatetime.toJSDate()
  const defaults: ActionData = {
    id: '721e2108-60f5-4a75-b102-04fe6a40e899',
    statut: Action.Statut.PAS_COMMENCEE,
    idJeune: 'ABCDE',
    contenu: "Contenu de l'action",
    commentaire: "Commentaire de l'action",
    dateDerniereActualisation: now,
    dateCreation: now,
    idCreateur: '1',
    typeCreateur: Action.TypeCreateur.CONSEILLER
  }

  return new Action({ ...defaults, ...args })
}
