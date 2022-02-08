import { Inject, Injectable } from '@nestjs/common'
import { ActionQueryModel } from '../../application/queries/query-models/actions.query-model'
import { Action } from '../../domain/action'
import { ActionDto, ActionSqlModel } from '../sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { AsSql } from '../sequelize/types'
import {
  fromSqlToActionQueryModel,
  fromSqlToActionQueryModelWithJeune
} from './mappers/actions.mappers'
import { SequelizeInjectionToken } from '../sequelize/providers'
import { Sequelize } from 'sequelize'

@Injectable()
export class ActionSqlRepository implements Action.Repository {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {}

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

  async getConseillerEtJeune(
    id: Action.Id
  ): Promise<{ idConseiller: string; idJeune: string } | undefined> {
    const sqlModel = await ActionSqlModel.findByPk(id, {
      attributes: [],
      include: [
        {
          model: JeuneSqlModel,
          attributes: ['idConseiller', 'id']
        }
      ]
    })
    if (!sqlModel) return undefined
    return {
      idJeune: sqlModel.getDataValue('jeune').id,
      idConseiller: sqlModel.getDataValue('jeune').idConseiller
    }
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

    return fromSqlToActionQueryModelWithJeune(actionSqlModel)
  }

  async getQueryModelByJeuneId(id: string): Promise<ActionQueryModel[]> {
    const actionsSqlModel = await ActionSqlModel.findAll({
      where: {
        idJeune: id
      },
      order: [
        this.sequelize.literal(
          `CASE WHEN statut = '${Action.Statut.TERMINEE}' THEN 1 ELSE 0 END`
        ),
        ['date_derniere_actualisation', 'DESC']
      ],
      include: [
        {
          model: JeuneSqlModel,
          required: true
        }
      ]
    })

    const actions = []
    for (const actionSql of actionsSqlModel) {
      actions.push(await fromSqlToActionQueryModel(actionSql))
    }

    return actions
  }

  static actionFromSqlModel(sqlModel: AsSql<ActionDto>): Action {
    return {
      id: sqlModel.id,
      statut: sqlModel.statut,
      idJeune: sqlModel.idJeune,
      commentaire: sqlModel.commentaire,
      contenu: sqlModel.contenu,
      dateCreation: sqlModel.dateCreation,
      dateDerniereActualisation: sqlModel.dateDerniereActualisation,
      createur: {
        id: sqlModel.createur.id,
        nom: sqlModel.createur.nom,
        prenom: sqlModel.createur.prenom,
        type: sqlModel.typeCreateur
      }
    }
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
      idCreateur: action.createur.id,
      createur: {
        id: action.createur.id,
        nom: action.createur.nom,
        prenom: action.createur.prenom
      },
      typeCreateur: action.createur.type,
      estVisibleParConseiller: true,
      dateLimite: null
    }
  }
}
