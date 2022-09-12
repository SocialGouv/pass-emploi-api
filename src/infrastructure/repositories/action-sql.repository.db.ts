import { Injectable } from '@nestjs/common'
import { Action } from '../../domain/action/action'
import { ActionDto, ActionSqlModel } from '../sequelize/models/action.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { AsSql } from '../sequelize/types'
import { FindOptions, Op } from 'sequelize'
import { DateService } from '../../utils/date-service'
import { buildQualification } from './mappers/actions.mappers'
import { CommentaireSqlModel } from '../sequelize/models/commentaire.sql-model'

@Injectable()
export class ActionSqlRepository implements Action.Repository {
  constructor(private dateService: DateService) {}

  async save(action: Action): Promise<void> {
    await ActionSqlModel.modifierOuCreer(
      ActionSqlRepository.sqlModelFromAction(action)
    )
  }

  async get(
    id: Action.Id,
    options?: { avecCommentaires: boolean }
  ): Promise<Action | undefined> {
    const sqlModel = await ActionSqlModel.findByPk(
      id,
      generateGetOptions(options)
    )
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

  async findAllActionsByIdJeune(idJeune: string): Promise<Action[]> {
    const actionsSql = await ActionSqlModel.findAll({
      where: {
        idJeune
      }
    })

    return actionsSql.map(ActionSqlRepository.actionFromSqlModel)
  }

  static actionFromSqlModel(sqlModel: ActionSqlModel): Action {
    const action: Action = {
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
      dateDebut: sqlModel.dateDebut ?? undefined,
      dateEcheance: sqlModel.dateEcheance,
      dateFinReelle: sqlModel.dateFinReelle ?? undefined,
      rappel: sqlModel.rappel,
      qualification: buildQualification(sqlModel)
    }
    if (sqlModel.commentaires) {
      action.commentaires = sqlModel.commentaires.map(commentaireSql =>
        commentaireSql.get()
      )
    }
    return action
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
      dateDebut: action.dateDebut ?? null,
      dateFinReelle: action.dateFinReelle ?? null,
      rappel: action.rappel,
      codeQualification: action.qualification?.code ?? null,
      heuresQualifiees: action.qualification?.heures ?? null
    }
  }
}

function generateGetOptions(attributs?: {
  avecCommentaires: boolean
}): Omit<FindOptions, 'where'> {
  const getOptions: Omit<FindOptions, 'where'> = {}

  if (attributs?.avecCommentaires) {
    getOptions.include = [
      {
        model: CommentaireSqlModel
      }
    ]
  }
  return getOptions
}
