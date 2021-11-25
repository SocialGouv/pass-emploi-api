import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { ActionQueryModel } from '../../application/queries/query-models/actions.query-model'
import { Action } from '../../domain/action'
import { ActionDto, ActionSqlModel } from '../sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { AsSql } from '../sequelize/types'

@Injectable()
export class ActionSqlRepository implements Action.Repository {
  async save(action: Action): Promise<void> {
    await ActionSqlModel.modifierOuCreer(
      ActionSqlRepository.sqlModelFromAction(action)
    )
  }

  async get(id: Action.Id): Promise<Action | undefined> {
    const sqlModel = await ActionSqlModel.findByPk(id)
    if (!sqlModel) return undefined

    return ActionSqlRepository.actionFromSqlModel(sqlModel)
  }

  async delete(idAction: string): Promise<void> {
    await ActionSqlModel.destroy({
      where: {
        id: idAction
      }
    })
  }

  async getQueryModelById(id: string): Promise<ActionQueryModel | undefined> {
    const actionSqlModel = await ActionSqlModel.findByPk(id, {
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })
    if (!actionSqlModel) return undefined

    return fromSqlToConseillerQueryModel(actionSqlModel)
  }

  async getQueryModelByJeuneId(id: string): Promise<ActionQueryModel[]> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: id
      },
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })

    const actions = []
    for (const actionSql of actionsSqlModel) {
      actions.push(await fromSqlToJeuneQueryModel(actionSql))
    }

    return actions
  }

  static actionFromSqlModel(sqlModel: AsSql<ActionDto>): Action {
    return new Action({
      id: sqlModel.id,
      statut: sqlModel.statut,
      idJeune: sqlModel.idJeune,
      commentaire: sqlModel.commentaire,
      contenu: sqlModel.contenu,
      dateCreation: sqlModel.dateCreation,
      dateDerniereActualisation: sqlModel.dateDerniereActualisation,
      idCreateur: sqlModel.idCreateur,
      typeCreateur: sqlModel.typeCreateur
    })
  }

  static sqlModelFromAction(action: Action): AsSql<ActionDto> {
    return {
      id: action.id,
      statut: action.statut,
      commentaire: action.commentaire,
      contenu: action.contenu,
      dateCreation: action.dateCreation,
      dateDerniereActualisation: action.dateDerniereActualisation,
      idJeune: action.idJeune,
      idCreateur: action.idCreateur,
      typeCreateur: action.typeCreateur,
      estVisibleParConseiller: true,
      dateLimite: null
    }
  }
}

async function fromSqlToConseillerQueryModel(
  actionSqlModel: ActionSqlModel
): Promise<ActionQueryModel> {
  return {
    ...(await fromSqlToJeuneQueryModel(actionSqlModel)),
    jeune: {
      id: actionSqlModel.jeune.id,
      firstName: actionSqlModel.jeune.prenom,
      lastName: actionSqlModel.jeune.nom
    }
  }
}

async function fromSqlToJeuneQueryModel(
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
