import { Injectable } from '@nestjs/common'
import { Action } from '../../domain/action/action'
import { ActionDto, ActionSqlModel } from '../sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { AsSql } from '../sequelize/types'
import { Op } from 'sequelize'
import { DateService } from '../../utils/date-service'

@Injectable()
export class ActionSqlRepository implements Action.Repository {
  constructor(private dateService: DateService) {}

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

  async findAllActionsARappeler(): Promise<Action[]> {
    const dans3JoursAMinuit = this.dateService
      .nowAtMidnight()
      .plus({ days: 3 })
      .toJSDate()
    const actionsSql = await ActionSqlModel.findAll({
      where: {
        rappel: true,
        dateEcheance: {
          [Op.gte]: dans3JoursAMinuit
        },
        statut: {
          [Op.notIn]: [Action.Statut.ANNULEE, Action.Statut.TERMINEE]
        }
      }
    })
    return actionsSql.map(ActionSqlRepository.actionFromSqlModel)
  }

  async delete(idAction: string): Promise<void> {
    await ActionSqlModel.destroy({
      where: {
        id: idAction
      }
    })
  }

  static actionFromSqlModel(sqlModel: AsSql<ActionSqlModel>): Action {
    return {
      id: sqlModel.id,
      statut: sqlModel.statut,
      idJeune: sqlModel.idJeune,
      description: sqlModel.description,
      contenu: sqlModel.contenu,
      dateCreation: sqlModel.dateCreation,
      dateDerniereActualisation: sqlModel.dateDerniereActualisation,
      createur: {
        id: sqlModel.createur.id,
        nom: sqlModel.createur.nom,
        prenom: sqlModel.createur.prenom,
        type: sqlModel.typeCreateur
      },
      dateEcheance: sqlModel.dateEcheance,
      dateFinReelle: sqlModel.dateFinReelle ?? undefined,
      rappel: sqlModel.rappel
    }
  }

  static sqlModelFromAction(action: Action): AsSql<ActionDto> {
    return {
      id: action.id,
      statut: action.statut,
      description: action.description,
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
      dateEcheance: action.dateEcheance,
      dateFinReelle: action.dateFinReelle ?? null,
      rappel: action.rappel
    }
  }
}
