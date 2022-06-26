import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-model'
import { Core } from 'src/domain/core'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Action } from '../../domain/action'
import { Jeune } from '../../domain/jeune'
import { FirebaseClient } from '../clients/firebase-client'
import { ActionSqlModel } from '../sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../sequelize/models/rendez-vous.sql-model'
import { TransfertConseillerSqlModel } from '../sequelize/models/transfert-conseiller.sql-model'
import { SequelizeInjectionToken } from '../sequelize/providers'
import {
  fromSqlToJeune,
  fromSqlToJeuneHomeQueryModel,
  toSqlJeune
} from './mappers/jeunes.mappers'

@Injectable()
export class JeuneSqlRepository implements Jeune.Repository {
  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private firebaseClient: FirebaseClient,
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
      `select exists(select 1 from jeune where id = :idJeune)`,
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

  async getByIdDossier(idDossier: string): Promise<Jeune | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findOne({
      where: { idDossier }
    })
    if (!jeuneSqlModel) {
      return undefined
    }
    return fromSqlToJeune(jeuneSqlModel)
  }

  async transferAndSaveAll(
    jeunes: Jeune[],
    idConseillerCible: string,
    idConseillerSource: string
  ): Promise<void> {
    const idsJeunes = jeunes.map(jeune => jeune.id)
    await this.firebaseClient.transfererChat(idConseillerCible, idsJeunes)
    await Promise.all([
      this.creerTransferts(idConseillerSource, idConseillerCible, idsJeunes),
      this.saveAll(jeunes)
    ])
  }

  async findAllJeunesByConseiller(
    idsJeunes: string[],
    idConseiller: string
  ): Promise<Jeune[]> {
    const jeunesSqlModel = await JeuneSqlModel.findAll({
      where: {
        id: {
          [Op.in]: idsJeunes
        },
        idConseiller
      }
    })
    return jeunesSqlModel.map(fromSqlToJeune)
  }

  async findAllJeunesByConseillerInitial(
    idConseiller: string
  ): Promise<Jeune[]> {
    const jeunesSqlModel = await JeuneSqlModel.findAll({
      where: {
        idConseillerInitial: idConseiller
      },
      include: [ConseillerSqlModel]
    })
    return jeunesSqlModel.map(fromSqlToJeune)
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
      throw new NotFoundException("Le jeune n'existe pas")
    }
    const rdvJeuneSqlModel = await RendezVousSqlModel.findAll({
      include: [
        {
          model: JeuneSqlModel,
          where: { id: idJeune }
        }
      ],
      where: {
        dateSuppression: {
          [Op.is]: null
        }
      }
    })
    return fromSqlToJeuneHomeQueryModel(jeuneSqlModel, rdvJeuneSqlModel)
  }

  async getJeunesMilo(offset: number, limit: number): Promise<Jeune[]> {
    const jeunesMiloSqlModel = await JeuneSqlModel.findAll({
      where: {
        structure: Core.Structure.MILO,
        idDossier: { [Op.ne]: null }
      },
      order: [['id', 'ASC']],
      offset,
      limit
    })

    return jeunesMiloSqlModel.map(fromSqlToJeune)
  }

  private async saveAll(jeunes: Jeune[]): Promise<void> {
    for (const jeune of jeunes) {
      await JeuneSqlModel.upsert(toSqlJeune(jeune))
    }
  }

  private async creerTransferts(
    idConseillerSource: string,
    idConseillerCible: string,
    idsJeunes: string[]
  ): Promise<void> {
    const dateTransfert = this.dateService.nowJs()
    await TransfertConseillerSqlModel.bulkCreate(
      idsJeunes.map(idJeune => {
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
}

export interface ResumeActionsJeuneDto {
  id_jeune: string
  prenom_jeune: string
  nom_jeune: string
  todo_actions_count: string
  done_actions_count: string
  in_progress_actions_count: string
}
