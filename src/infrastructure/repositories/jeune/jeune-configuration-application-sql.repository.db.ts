import { Injectable } from '@nestjs/common'
import { Jeune } from '../../../domain/jeune/jeune'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'
import { fromSqlToPreferencesJeune } from '../mappers/jeunes.mappers'

@Injectable()
export class JeuneConfigurationApplicationSqlRepository
  implements Jeune.ConfigurationApplication.Repository
{
  async get(
    idJeune: string
  ): Promise<Jeune.ConfigurationApplication | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(idJeune, {
      attributes: attributesConfigurationApplication
    })
    if (!jeuneSqlModel) {
      return undefined
    }

    return toConfigurationApplication(jeuneSqlModel)
  }

  async save(
    configurationApplication: Jeune.ConfigurationApplication
  ): Promise<void> {
    await JeuneSqlModel.update(
      {
        appVersion: configurationApplication.appVersion ?? null,
        pushNotificationToken:
          configurationApplication.pushNotificationToken ?? null,
        dateDerniereActualisationToken:
          configurationApplication.dateDerniereActualisationToken,
        installationId: configurationApplication.installationId ?? null,
        instanceId: configurationApplication.instanceId ?? null,
        timezone: configurationApplication.fuseauHoraire ?? null
      },
      { where: { id: configurationApplication.idJeune } }
    )
  }
}

function toConfigurationApplication(
  jeuneSqlModel: JeuneSqlModel
): Jeune.ConfigurationApplication {
  return {
    idJeune: jeuneSqlModel.id,
    appVersion: jeuneSqlModel.appVersion ?? undefined,
    installationId: jeuneSqlModel.installationId ?? undefined,
    instanceId: jeuneSqlModel.instanceId ?? undefined,
    pushNotificationToken: jeuneSqlModel.pushNotificationToken ?? undefined,
    fuseauHoraire: jeuneSqlModel.timezone ?? undefined,
    dateDerniereActualisationToken:
      jeuneSqlModel.dateDerniereActualisationToken ?? undefined,
    preferences: fromSqlToPreferencesJeune(jeuneSqlModel)
  }
}

const attributesConfigurationApplication = [
  'id',
  'appVersion',
  'installationId',
  'instanceId',
  'pushNotificationToken',
  'dateDerniereActualisationToken',
  'timezone',
  'partageFavoris',
  'notificationsAlertesOffres',
  'notificationsMessages',
  'notificationsCreationActionConseiller',
  'notificationsRendezVousSessions',
  'notificationsRappelActions'
]
