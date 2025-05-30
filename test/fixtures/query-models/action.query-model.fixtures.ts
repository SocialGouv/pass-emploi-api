import { DateTime } from 'luxon'
import {
  ActionQueryModel,
  QualificationActionQueryModel
} from '../../../src/application/queries/query-models/actions.query-model'
import { Action } from '../../../src/domain/action/action'
import { Jeune } from '../../../src/domain/jeune/jeune'

export const uneActionQueryModelFromDomain = (
  action: Action,
  jeune: Jeune,
  etat: Action.Qualification.Etat = Action.Qualification.Etat.NON_QUALIFIABLE,
  qualification: QualificationActionQueryModel | undefined = undefined
): ActionQueryModel => ({
  id: action.id,
  content: action.contenu,
  comment: action.description,
  status: action.statut,
  dateCreation: action.dateCreation.toISO(),
  dateDerniereActualisation: action.dateDerniereActualisation.toISO(),
  creator: 'Nils Tavernier',
  creatorType: Action.TypeCreateur.CONSEILLER,
  dateEcheance: action.dateEcheance.toISO(),
  dateFinReelle: undefined,
  jeune: {
    id: jeune.id,
    lastName: jeune.lastName,
    firstName: jeune.firstName,
    idConseiller: jeune.conseiller!.id,
    dispositif: jeune.dispositif
  },
  etat,
  qualification,
  // deprecated
  creationDate: action.dateCreation.toFormat('EEE, d MMM yyyy HH:mm:ss z'),
  // deprecated
  lastUpdate: action.dateDerniereActualisation.toFormat(
    'EEE, d MMM yyyy HH:mm:ss z'
  )
})

export const uneActionQueryModelTermineeAvecQualification = (
  action: Action,
  jeune: Jeune
): ActionQueryModel => ({
  ...uneActionQueryModelFromDomain(action, jeune),
  status: Action.Statut.TERMINEE,
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
    id: 'd2e48a82-c664-455a-b3a5-bb0465a72022',
    comment: "Description de l'action",
    content: "Contenu de l'action",
    dateCreation: DateTime.fromISO('2021-11-11T08:03:30.000Z').toISO(),
    dateDerniereActualisation: DateTime.fromISO(
      '2021-11-11T08:03:30.000Z'
    ).toISO(),
    creator: 'Nils Tavernier',
    jeune: {
      firstName: 'John',
      id: 'ABCDE',
      idConseiller: '1',
      lastName: 'Doe',
      dispositif: 'CEJ'
    },
    creatorType: Action.TypeCreateur.CONSEILLER,
    dateEcheance: DateTime.fromISO('2021-11-11T08:03:30.000Z').toISO(),
    dateFinReelle: undefined,
    status: Action.Statut.PAS_COMMENCEE,
    etat: Action.Qualification.Etat.NON_QUALIFIABLE,
    qualification: undefined,
    // deprecated
    creationDate: DateTime.fromISO('2021-11-11T08:03:30.000Z').toFormat(
      'EEE, d MMM yyyy HH:mm:ss z'
    ),
    // deprecated
    lastUpdate: DateTime.fromISO('2021-11-11T08:03:30.000Z').toFormat(
      'EEE, d MMM yyyy HH:mm:ss z'
    )
  }

  return { ...defaults, ...args }
}
