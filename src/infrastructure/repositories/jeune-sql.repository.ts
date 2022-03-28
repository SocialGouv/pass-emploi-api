import { Inject, Injectable } from '@nestjs/common'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-models'
import {
  DetailJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-models'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Action } from '../../domain/action'
import { Authentification } from '../../domain/authentification'
import { NotFound } from '../../domain/erreur'
import { Jeune } from '../../domain/jeune'
import { ActionSqlModel } from '../sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import { TransfertConseillerSqlModel } from '../sequelize/models/transfert-conseiller.sql-model'
import { SequelizeInjectionToken } from '../sequelize/providers'
import {
  fromSqlToDetailJeuneQueryModel,
  fromSqlToJeune,
  fromSqlToJeuneHomeQueryModel,
  toDetailJeunQueryModel,
  toResumeActionsDuJeuneQueryModel,
  toSqlJeune
} from './mappers/jeunes.mappers'

@Injectable()
export class JeuneSqlRepository implements Jeune.Repository {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private idService: IdService,
    private dateService: DateService
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

  async existe(id: string): Promise<boolean> {
    const exists = (await this.sequelize.query(
      `select exists(select 1 from jeune where id=:idJeune)`,
      {
        replacements: { idJeune: id }
      }
    )) as Array<Array<{ exists: boolean }>>
    return Boolean(exists[0][0].exists)
  }

  async getByEmail(email: string): Promise<Jeune | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: { email }
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

  async saveAll(jeunes: Jeune[]): Promise<void> {
    for (const jeune of jeunes) {
      await JeuneSqlModel.upsert(toSqlJeune(jeune))
    }
  }

  async getJeunes(idsJeune: string[]): Promise<Jeune[]> {
    const jeunesSqlModel = await JeuneSqlModel.findAll({
      where: {
        id: {
          [Op.in]: idsJeune
        }
      }
    })
    return jeunesSqlModel.map(fromSqlToJeune)
  }

  async creerTransferts(
    idConseillerSource: string,
    idConseillerCible: string,
    idsJeune: string[]
  ): Promise<void> {
    const dateTransfert = this.dateService.nowJs()
    await TransfertConseillerSqlModel.bulkCreate(
      idsJeune.map(idJeune => {
        return {
          id: this.idService.uuid(),
          idJeune,
          idConseillerSource,
          idConseillerCible,
          dateTransfert
        }
      })
    )
  }

  async getAllQueryModelsByConseiller(
    idConseiller: string
  ): Promise<DetailJeuneQueryModel[]> {
    const sqlJeunes = await this.sequelize.query(
      `
          SELECT jeune.id,
                 jeune.prenom,
                 jeune.nom,
                 jeune.email,
                 jeune.date_creation,
                 jeune.id_authentification,
                 MAX(evenement_engagement.date_evenement) as date_evenement,
                 conseiller.email                         as email_conseiller_precedent,
                 conseiller.prenom                        as prenom_conseiller_precedent,
                 conseiller.nom                           as nom_conseiller_precedent
          FROM jeune
                   LEFT JOIN evenement_engagement
                             ON evenement_engagement.id_utilisateur = jeune.id AND
                                evenement_engagement.type_utilisateur = '${Authentification.Type.JEUNE}'
                   LEFT JOIN transfert_conseiller
                             ON transfert_conseiller.id = (SELECT transfert_conseiller.id
                                                           FROM transfert_conseiller
                                                           WHERE transfert_conseiller.id_jeune = jeune.id
                                                             AND transfert_conseiller.id_conseiller_cible = jeune.id_conseiller
                                                           ORDER BY transfert_conseiller.date_transfert DESC
                                                           LIMIT 1
                             )
                   LEFT JOIN conseiller ON conseiller.id = transfert_conseiller.id_conseiller_source
          WHERE jeune.id_conseiller = :idConseiller
          GROUP BY jeune.id, transfert_conseiller.id, conseiller.id
          ORDER BY jeune.prenom ASC, jeune.nom ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { idConseiller }
      }
    )

    return sqlJeunes.map(toDetailJeunQueryModel)
  }

  async save(jeune: Jeune): Promise<void> {
    await JeuneSqlModel.upsert({
      id: jeune.id,
      nom: jeune.lastName,
      prenom: jeune.firstName,
      idConseiller: jeune.conseiller!.id,
      pushNotificationToken: jeune.pushNotificationToken ?? null,
      dateCreation: jeune.creationDate.toJSDate(),
      dateDerniereActualisationToken: jeune.tokenLastUpdate?.toJSDate() ?? null,
      email: jeune.email ?? null,
      structure: jeune.structure,
      idDossier: jeune.idDossier ?? null
    })
  }

  async supprimer(jeune: Jeune.Id): Promise<void> {
    await JeuneSqlModel.supprimer(jeune)
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
    idConseiller: string
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
