import { DateTime } from 'luxon'
import { ActionQueryModel } from 'src/application/queries/query-models/actions.query-model'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { fromSqlToDetailJeuneQueryModel } from './jeunes.mappers'

export async function fromSqlToConseillerActionQueryModel(
  actionSqlModel: ActionSqlModel
): Promise<ActionQueryModel> {
  return {
    ...(await fromSqlToActionQueryModel(actionSqlModel)),
    jeune: fromSqlToDetailJeuneQueryModel(actionSqlModel.jeune)
  }
}

export async function fromSqlToActionQueryModel(
  actionSqlModel: ActionSqlModel
): Promise<ActionQueryModel> {
  return {
    id: actionSqlModel.id,
    comment: actionSqlModel.commentaire || '',
    content: actionSqlModel.contenu,
    creationDate: DateTime.fromJSDate(actionSqlModel.dateCreation)
      .toUTC()
      .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
    creator: await parseNomCompletCreateur(actionSqlModel),
    creatorType: actionSqlModel.typeCreateur,
    lastUpdate: DateTime.fromJSDate(actionSqlModel.dateDerniereActualisation)
      .toUTC()
      .toFormat('EEE, d MMM yyyy HH:mm:ss z'),
    status: actionSqlModel.statut
  }
}

async function parseNomCompletCreateur(
  sqlModel: ActionSqlModel
): Promise<string> {
  if (sqlModel.typeCreateur === 'jeune') {
    return `${sqlModel.jeune.prenom} ${sqlModel.jeune.nom}`
  }

  const conseillerSqlModel = await ConseillerSqlModel.findByPk(
    sqlModel.idCreateur
  )
  if (!conseillerSqlModel) {
    throw new Error(`Le créateur de l'action ${sqlModel.id} n'existe pas`)
  }
  return `${conseillerSqlModel.prenom} ${conseillerSqlModel.nom}`
}
