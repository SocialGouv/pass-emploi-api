import { v4 as uuidV4 } from 'uuid'
import { Action } from '../../../src/domain/action/action'
import { ActionDto } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { DateTime } from 'luxon'

export function uneActionDto(
  args: Partial<AsSql<ActionDto>> = {}
): AsSql<ActionDto> {
  const defaults: AsSql<ActionDto> = {
    id: uuidV4(),
    contenu: "Contenu de l'action",
    description: "Description de l'action",
    dateCreation: DateTime.fromISO('2021-11-11T08:03:30.000Z').toJSDate(),
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
    dateEcheance: DateTime.fromISO('2021-11-11T08:03:30.000Z').toJSDate(),
    dateDebut: null,
    dateFinReelle: null,
    rappel: true,
    heuresQualifiees: null,
    codeQualification: null,
    commentaireQualification: null
  }

  return { ...defaults, ...args }
}
