import { Inject, Injectable } from '@nestjs/common'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-models'
import {
  DetailJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-models'
import { Action } from '../../domain/action'
import { Conseiller } from '../../domain/conseiller'
import { NotFound } from '../../domain/erreur'
import { Jeune } from '../../domain/jeune'
import { ActionSqlModel } from '../sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../sequelize/providers'
import {
  fromSqlToDetailJeuneQueryModel,
  fromSqlToJeune,
  fromSqlToJeuneHomeQueryModel,
  toResumeActionsDuJeuneQueryModel
} from './mappers/jeunes.mappers'

@Injectable()
export class JeuneSqlRepository implements Jeune.Repository {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize
  ) {}

  async get(id: string): Promise<Jeune | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(id, {
      include: [ConseillerSqlModel]
    })
    if (!jeuneSqlModel) {
      return undefined
    }
    return fromSqlToJeune(jeuneSqlModel)
  }

  async getQueryModelById(
    id: string
  ): Promise<DetailJeuneQueryModel | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(id)
    if (!jeuneSqlModel) {
      return undefined
    }

    return fromSqlToDetailJeuneQueryModel(jeuneSqlModel)
  }

  async getAllQueryModelsByConseiller(
    idConseiller: string
  ): Promise<DetailJeuneQueryModel[]> {
    const allJeunesSql = await JeuneSqlModel.findAll({
      where: {
        idConseiller
      },
      order: [
        ['prenom', 'ASC'],
        ['nom', 'ASC']
      ]
    })

    return allJeunesSql.map(fromSqlToDetailJeuneQueryModel)
  }

  async save(jeune: Jeune): Promise<void> {
    await JeuneSqlModel.upsert({
      id: jeune.id,
      nom: jeune.lastName,
      prenom: jeune.firstName,
      idConseiller: jeune.conseiller.id,
      pushNotificationToken: jeune.pushNotificationToken ?? null,
      dateCreation: jeune.creationDate.toJSDate(),
      dateDerniereActualisationToken: jeune.tokenLastUpdate?.toJSDate() ?? null,
      email: jeune.email ?? null,
      structure: jeune.structure
    })
  }

  async getHomeQueryModel(idJeune: string): Promise<JeuneHomeQueryModel> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(idJeune, {
      include: [
        ConseillerSqlModel,
        {
          model: RendezVousSqlModel,
          where: {
            dateSuppression: {
              [Op.is]: null
            }
          },
          required: false
        },
        {
          model: ActionSqlModel,
          required: false,
          where: {
            statut: Action.Statut.PAS_COMMENCEE
          },
          order: [['dateDerniereActualisation', 'DESC']],
          limit: 2
        }
      ]
    })
    if (!jeuneSqlModel) {
      throw new NotFound(idJeune, 'Jeune')
    }
    return fromSqlToJeuneHomeQueryModel(jeuneSqlModel)
  }

  async getResumeActionsDesJeunesDuConseiller(
    idConseiller: Conseiller.Id
  ): Promise<ResumeActionsDuJeuneQueryModel[]> {
    const resumesActionsParJeune =
      await this.sequelize.query<ResumeActionsJeuneDto>(
        `
        SELECT jeune.id                                                                   as id_jeune,
               jeune.prenom                                                               as prenom_jeune,
               jeune.nom                                                                  as nom_jeune,
               COUNT(CASE WHEN statut = 'in_progress' AND id_jeune = jeune.id THEN 1 END) as in_progress_actions_count,
               COUNT(CASE WHEN statut = 'not_started' AND id_jeune = jeune.id THEN 1 END) as todo_actions_count,
               COUNT(CASE WHEN statut = 'done' AND id_jeune = jeune.id THEN 1 END)        as done_actions_count
        FROM action
                 RIGHT JOIN jeune ON action.id_jeune = jeune.id
        WHERE id_conseiller = :idConseiller
        GROUP BY jeune.id
        ORDER BY jeune.nom
    `,
        {
          type: QueryTypes.SELECT,
          replacements: { idConseiller }
        }
      )

    return resumesActionsParJeune.map(toResumeActionsDuJeuneQueryModel)
  }
}

export interface ResumeActionsJeuneDto {
  id_jeune: string
  prenom_jeune: string
  nom_jeune: string
  todo_actions_count: string
  done_actions_count: string
  in_progress_actions_count: string
}
