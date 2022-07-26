import { Action } from '../../src/domain/action'
import { uneDate, uneDatetime } from './date.fixture'

export const uneAction = (args: Partial<Action> = {}): Action => {
  const now = uneDatetime.toJSDate()
  const defaults: Action = {
    id: '721e2108-60f5-4a75-b102-04fe6a40e899',
    statut: Action.Statut.PAS_COMMENCEE,
    idJeune: 'ABCDE',
    contenu: "Contenu de l'action",
    commentaire: "Commentaire de l'action",
    dateDerniereActualisation: now,
    dateCreation: now,
    createur: {
      id: '1',
      type: Action.TypeCreateur.CONSEILLER,
      prenom: 'Nils',
      nom: 'Tavernier'
    },
    dateEcheance: uneDate(),
    rappel: true
  }

  return { ...defaults, ...args }
}
