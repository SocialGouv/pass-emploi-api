import { Action } from '../../src/domain/action/action'
import { uneDate, uneDatetime } from './date.fixture'

export const uneAction = (args: Partial<Action> = {}): Action => {
  const now = uneDatetime.toJSDate()
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
    dateEcheance: new Date('2020-02-02'),
    dateFinReelle: undefined,
    rappel: true
  }

  return { ...defaults, ...args }
}

export const unCommentaire = (
  args: Partial<Action.Commentaire> = {}
): Action.Commentaire => {
  const defaults: Action.Commentaire = {
    id: 'poi-id-commentaire',
    idAction: '721e2108-60f5-4a75-b102-04fe6a40e899',
    date: uneDate(),
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
