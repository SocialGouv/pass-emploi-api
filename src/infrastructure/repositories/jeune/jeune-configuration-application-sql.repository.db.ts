import { Injectable } from '@nestjs/common'
import { Jeune } from '../../../domain/jeune/jeune'
import { JeuneSqlModel } from '../../sequelize/models/jeune.sql-model'

@Injectable()
export class JeuneConfigurationApplicationSqlRepository
  implements Jeune.ConfigurationApplication.Repository
{
  async get(
    idJeune: string
  ): Promise<Jeune.ConfigurationApplication | undefined> {
    const jeuneSqlModel = await JeuneSqlModel.findByPk(idJeune)
    if (!jeuneSqlModel) {
      return undefined
    }

    const configurationApplication: Jeune.ConfigurationApplication = {
      idJeune: jeuneSqlModel.id,
      appVersion: jeuneSqlModel.appVersion ?? undefined,
      installationId: jeuneSqlModel.installationId ?? undefined,
      pushNotificationToken: jeuneSqlModel.pushNotificationToken ?? undefined,
      dateDerniereActualisationToken:
        jeuneSqlModel.dateDerniereActualisationToken ?? undefined
    }
    return configurationApplication
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
        installationId: configurationApplication.installationId ?? null
      },
      { where: { id: configurationApplication.idJeune } }
    )
  }
}
