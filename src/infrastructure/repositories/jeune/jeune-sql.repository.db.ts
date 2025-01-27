import { Inject, Injectable } from '@nestjs/common'
import { Op, Sequelize } from 'sequelize'
import { Jeune } from '../../../domain/jeune/jeune'
import { DateService } from '../../../utils/date-service'
import { IdService } from '../../../utils/id-service'
import { FirebaseClient } from '../../clients/firebase-client'
import { ConseillerSqlModel } from '../../sequelize/models/conseiller.sql-model'
import { JeuneDto, JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { TransfertConseillerSqlModel } from '../../sequelize/models/transfert-conseiller.sql-model'
import { SequelizeInjectionToken } from '../../sequelize/providers'
import { AsSql } from '../../sequelize/types'
import { fromSqlToJeune } from '../mappers/jeunes.mappers'
import { Core } from '../../../domain/core'

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

  async findAll(ids: string[]): Promise<Jeune[]> {
    const jeunesSqlModels = await JeuneSqlModel.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      include: [ConseillerSqlModel]
    })
    return jeunesSqlModels.map(fromSqlToJeune)
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

  async transferAndSaveAll(
    jeunes: Jeune[],
    idConseillerCible: string,
    idConseillerSource: string,
    idConseillerQuiTransfert: string,
    typeTransfert: Jeune.TypeTransfert
  ): Promise<void> {
    const idsJeunes = jeunes.map(jeune => jeune.id)
    await this.firebaseClient.transfererChat(idConseillerCible, idsJeunes)
    await Promise.all([
      this.creerTransferts(
        jeunes,
        idConseillerSource,
        idConseillerCible,
        idConseillerQuiTransfert,
        typeTransfert
      ),
      this.saveAllJeuneTransferes(jeunes)
    ])
  }

  async findAllJeunesByConseiller(idConseiller: string): Promise<Jeune[]> {
    const jeunesSqlModel = await JeuneSqlModel.findAll({
      where: {
        idConseiller
      }
    })
    return jeunesSqlModel.map(fromSqlToJeune)
  }

  async findAllJeunesByIdsAndConseiller(
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

  async findAllJeunesByIdsAuthentificationAndStructures(
    idsAuthentificationJeunes: string[],
    structures: Core.Structure[]
  ): Promise<Array<Jeune & { idAuthentification: string }>> {
    const jeunesSqlModel = await JeuneSqlModel.findAll({
      where: {
        idAuthentification: {
          [Op.in]: idsAuthentificationJeunes
        },
        structure: {
          [Op.in]: structures
        }
      }
    })
    return jeunesSqlModel.map(sqlModel => ({
      ...fromSqlToJeune(sqlModel),
      idAuthentification: sqlModel.idAuthentification
    }))
  }

  async findAllJeunesByConseillerInitial(
    idConseiller: string
  ): Promise<Jeune[]> {
    const jeunesSqlModel = await JeuneSqlModel.findAll({
      where: {
        idConseillerInitial: idConseiller
      },
      order: [['id', 'ASC']],
      include: [ConseillerSqlModel]
    })
    return jeunesSqlModel.map(jeuneSqlModel => fromSqlToJeune(jeuneSqlModel))
  }

  async save(jeune: Jeune): Promise<void> {
    const jeuneDto: Partial<AsSql<JeuneDto>> = {
      id: jeune.id,
      nom: jeune.lastName,
      prenom: jeune.firstName,
      idConseiller: jeune.conseiller?.id,
      dateCreation: jeune.creationDate.toJSDate(),
      dateFinCEJ: jeune.dateFinCEJ?.toJSDate() ?? null,
      email: jeune.email ?? null,
      structure: jeune.structure,
      idPartenaire: jeune.idPartenaire ?? null,
      partageFavoris: jeune.preferences.partageFavoris,
      notificationsAlertesOffres: jeune.preferences.alertesOffres,
      notificationsMessages: jeune.preferences.messages,
      notificationsCreationActionConseiller:
        jeune.preferences.creationActionConseiller,
      notificationsRendezVousSessions: jeune.preferences.rendezVousSessions,
      notificationsRappelActions: jeune.preferences.rappelActions,
      appVersion: jeune.configuration.appVersion ?? null,
      pushNotificationToken: jeune.configuration.pushNotificationToken ?? null,
      dateDerniereActualisationToken:
        jeune.configuration.dateDerniereActualisationToken ?? null,
      installationId: jeune.configuration.installationId ?? null,
      instanceId: jeune.configuration.instanceId ?? null,
      timezone: jeune.configuration.fuseauHoraire ?? null,
      dateSignatureCGU: jeune.dateSignatureCGU?.toJSDate() ?? null,
      dispositif: jeune.dispositif
    }
    await JeuneSqlModel.upsert(jeuneDto)
  }

  async supprimer(jeune: Jeune.Id): Promise<void> {
    await JeuneSqlModel.supprimer(jeune)
  }

  async saveAllJeuneTransferes(jeunes: Jeune[]): Promise<void> {
    for (const jeune of jeunes) {
      const jeuneTransfereSQL: Omit<
        AsSql<JeuneDto>,
        | 'idAuthentification'
        | 'datePremiereConnexion'
        | 'dateDerniereConnexion'
        | 'appVersion'
        | 'installationId'
        | 'instanceId'
        | 'pushNotificationToken'
        | 'dateDerniereActualisationToken'
        | 'timezone'
        | 'idStructureMilo'
        | 'dateSignatureCGU'
      > = {
        id: jeune.id,
        nom: jeune.lastName,
        prenom: jeune.firstName,
        idConseiller: jeune.conseiller?.id,
        idConseillerInitial: jeune.conseillerInitial?.id ?? null,
        dateCreation: jeune.creationDate.toJSDate(),
        dateFinCEJ: jeune.dateFinCEJ?.toJSDate() ?? null,
        email: jeune.email ?? null,
        structure: jeune.structure,
        idPartenaire: jeune.idPartenaire ?? null,
        partageFavoris: jeune.preferences.partageFavoris,
        notificationsAlertesOffres: jeune.preferences.alertesOffres,
        notificationsMessages: jeune.preferences.messages,
        notificationsCreationActionConseiller:
          jeune.preferences.creationActionConseiller,
        notificationsRendezVousSessions: jeune.preferences.rendezVousSessions,
        notificationsRappelActions: jeune.preferences.rappelActions,
        dispositif: jeune.dispositif
      }
      await JeuneSqlModel.upsert(jeuneTransfereSQL)
    }
  }

  private async creerTransferts(
    jeunes: Jeune[],
    idConseillerSource: string,
    idConseillerCible: string,
    idConseillerQuiTransfert: string,
    typeTransfert: Jeune.TypeTransfert
  ): Promise<void> {
    const dateTransfert = this.dateService.nowJs()
    await TransfertConseillerSqlModel.bulkCreate(
      jeunes.map(jeune => {
        return {
          id: this.idService.uuid(),
          idJeune: jeune.id,
          emailJeune: jeune.email,
          idConseillerSource,
          idConseillerCible,
          idConseillerQuiTransfert,
          dateTransfert,
          typeTransfert
        }
      })
    )
  }
}
