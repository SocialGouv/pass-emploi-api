import { Injectable } from '@nestjs/common'
import { DateService } from '../../utils/date-service'

export interface ConfigurationApplication {
  idJeune: string
  pushNotificationToken?: string
  dateDerniereActualisationToken?: Date
  appVersion?: string
  installationId?: string
  instanceId?: string
}

export namespace ConfigurationApplication {
  export interface Repository {
    get(idJeune: string): Promise<ConfigurationApplication | undefined>

    save(configurationApplication: ConfigurationApplication): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(private dateService: DateService) {}

    mettreAJour(
      nouvelleConfiguration: ConfigurationApplication
    ): ConfigurationApplication {
      return {
        idJeune: nouvelleConfiguration.idJeune,
        pushNotificationToken: nouvelleConfiguration.pushNotificationToken,
        dateDerniereActualisationToken: this.dateService.nowJs(),
        installationId: nouvelleConfiguration.installationId,
        instanceId: nouvelleConfiguration.instanceId,
        appVersion: nouvelleConfiguration.appVersion
      }
    }
  }
}
