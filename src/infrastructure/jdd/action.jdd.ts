import { AsSql } from '../sequelize/types'
import { ActionDto } from '../sequelize/models/action.sql-model'
import * as uuid from 'uuid'
import { DateTime } from 'luxon'
import { Action } from '../../domain/action/action'

export function uneActionJdd(
  args: Partial<AsSql<ActionDto>> = {}
): AsSql<ActionDto> {
  const defaults: AsSql<ActionDto> = {
    id: uuid.v4(),
    contenu: "Contenu de l'action",
    description: "Description de l'action",
    dateCreation: DateTime.now().toJSDate(),
    dateDerniereActualisation: DateTime.fromISO(
      '2021-11-11T08:03:30.000Z'
    ).toJSDate(),
    idJeune: 'ABCDE',
    idCreateur: '1',
    typeCreateur: Action.TypeCreateur.CONSEILLER,
    createur: {
      id: '1',
      prenom: 'Nils',
      nom: 'Tavernier'
    },
    estVisibleParConseiller: true,
    statut: Action.Statut.PAS_COMMENCEE,
    dateEcheance: DateTime.now().toJSDate(),
    dateDebut: null,
    dateFinReelle: null,
    rappel: true,
    heuresQualifiees: null,
    codeQualification: null,
    commentaireQualification: null
  }

  return { ...defaults, ...args }
}
