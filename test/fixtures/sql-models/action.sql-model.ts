import * as uuid from 'uuid'
import { Action } from '../../../src/domain/action'
import { ActionDto } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

export function uneActionDto(
  args: Partial<AsSql<ActionDto>> = {}
): AsSql<ActionDto> {
  const defaults: AsSql<ActionDto> = {
    id: uuid.v4(),
    contenu: "Contenu de l'action",
    commentaire: "Commentaire de l'action",
    dateCreation: new Date('2021-11-11T08:03:30.000Z'),
    dateDerniereActualisation: new Date('2021-11-11T08:03:30.000Z'),
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
    dateLimite: null
  }

  return { ...defaults, ...args }
}
