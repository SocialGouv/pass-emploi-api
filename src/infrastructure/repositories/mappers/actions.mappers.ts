import { DateTime } from 'luxon'
import { ActionQueryModel } from 'src/application/queries/query-models/actions.query-model'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { fromSqlToJeuneQueryModel } from './jeunes.mappers'

export function fromSqlToActionQueryModelWithJeune(
  actionSqlModel: ActionSqlModel
): ActionQueryModel {
  return {
    ...fromSqlToActionQueryModel(actionSqlModel),
    jeune: fromSqlToJeuneQueryModel(actionSqlModel.jeune)
  }
}

export function fromSqlToActionQueryModel(
  actionSqlModel: ActionSqlModel
): ActionQueryModel {
  return {
    id: actionSqlModel.id,
    comment: actionSqlModel.commentaire || '',
    content: actionSqlModel.contenu,
    creationDate: DateTime.fromJSDate(actionSqlModel.dateCreation)
      .toUTC()
      .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
    creator: `${actionSqlModel.createur.prenom} ${actionSqlModel.createur.nom}`,
    creatorType: actionSqlModel.typeCreateur,
    lastUpdate: DateTime.fromJSDate(actionSqlModel.dateDerniereActualisation)
      .toUTC()
      .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
    status: actionSqlModel.statut
  }
}
