import { Inject, Injectable } from '@nestjs/common'
import { DateTime, Duration } from 'luxon'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import { Action } from '../../domain/action'
import { Conseiller } from '../../domain/conseiller'
import { NotFound } from '../../domain/erreur'
import {
  Jeune,
  JeuneHomeQueryModel,
  ResumeActionsDuJeuneQueryModel
} from '../../domain/jeune'
import { ActionSqlModel } from '../sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import { SequelizeInjectionToken } from '../sequelize/providers'
import { fromSqlToDetailJeuneQueryModel } from './mappers/jeunes.mappers'

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
    return buildJeuneFromSql(jeuneSqlModel)
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
      }
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
      dateDerniereActualisationToken: jeune.tokenLastUpdate?.toJSDate() ?? null
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
    return {
      conseiller: {
        id: jeuneSqlModel.conseiller.id,
        firstName: jeuneSqlModel.conseiller.prenom,
        lastName: jeuneSqlModel.conseiller.nom
      },
      doneActionsCount: jeuneSqlModel.actions.filter(
        actionsSql => actionsSql.statut === Action.Statut.TERMINEE
      ).length,
      actions: jeuneSqlModel.actions.map(actionSql => ({
        id: actionSql.id,
        creationDate: DateTime.fromJSDate(actionSql.dateCreation).toFormat(
          'EEE, d MMM yyyy HH:mm:ss z'
        ),
        content: actionSql.contenu,
        status: actionSql.statut,
        comment: actionSql.commentaire,
        isDone: actionSql.statut === Action.Statut.TERMINEE,
        lastUpdate: DateTime.fromJSDate(
          actionSql.dateDerniereActualisation
        ).toFormat('EEE, d MMM yyyy HH:mm:ss z'),
        creatorType: actionSql.typeCreateur,
        creator: toCreator(actionSql, jeuneSqlModel)
      })),
      rendezvous: jeuneSqlModel.rendezVous.map(rendezVousSql => ({
        id: rendezVousSql.id,
        comment: rendezVousSql.commentaire ?? '',
        date: DateTime.fromJSDate(rendezVousSql.date).toFormat(
          'EEE, d MMM yyyy HH:mm:ss z'
        ),
        duration: Duration.fromObject({
          minutes: rendezVousSql.duree
        }).toFormat('h:mm:ss'),
        modality: rendezVousSql.modalite ?? '',
        title: rendezVousSql.titre,
        subtitle: rendezVousSql.sousTitre
      }))
    }
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

    return resumesActionsParJeune.map(
      (resumeActionsJeuneDto: ResumeActionsJeuneDto) => ({
        jeuneId: resumeActionsJeuneDto.id_jeune,
        jeuneFirstName: resumeActionsJeuneDto.prenom_jeune,
        jeuneLastName: resumeActionsJeuneDto.nom_jeune,
        todoActionsCount: parseInt(resumeActionsJeuneDto.todo_actions_count),
        doneActionsCount: parseInt(resumeActionsJeuneDto.done_actions_count),
        inProgressActionsCount: parseInt(
          resumeActionsJeuneDto.in_progress_actions_count
        )
      })
    )
  }
}

function buildJeuneFromSql(jeuneSqlModel: JeuneSqlModel): Jeune {
  return {
    id: jeuneSqlModel.id,
    firstName: jeuneSqlModel.prenom,
    lastName: jeuneSqlModel.nom,
    creationDate: DateTime.fromJSDate(jeuneSqlModel.dateCreation),
    pushNotificationToken: jeuneSqlModel.pushNotificationToken ?? undefined,
    tokenLastUpdate: getTokenLastUpdate(jeuneSqlModel),
    conseiller: {
      id: jeuneSqlModel.conseiller.id,
      firstName: jeuneSqlModel.conseiller.prenom,
      lastName: jeuneSqlModel.conseiller.nom
    }
  }
}

function getTokenLastUpdate(
  jeuneSqlModel: JeuneSqlModel
): DateTime | undefined {
  return jeuneSqlModel.dateDerniereActualisationToken
    ? DateTime.fromJSDate(jeuneSqlModel.dateDerniereActualisationToken)
    : undefined
}

function toCreator(
  actionSql: ActionSqlModel,
  jeuneSqlModel: JeuneSqlModel
): string {
  if (actionSql.typeCreateur === Action.TypeCreateur.JEUNE) {
    return `${jeuneSqlModel.prenom} ${jeuneSqlModel.nom}`
  }
  return `${jeuneSqlModel.conseiller.prenom} ${jeuneSqlModel.conseiller.nom}`
}

interface ResumeActionsJeuneDto {
  id_jeune: string
  prenom_jeune: string
  nom_jeune: string
  todo_actions_count: string
  done_actions_count: string
  in_progress_actions_count: string
}
