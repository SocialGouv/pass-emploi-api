import { Injectable } from '@nestjs/common'
import { DateService } from '../../utils/date-service'

export interface ConfigurationApplication {
  idJeune: string
  pushNotificationToken?: string
  dateDerniereActualisationToken?: Date
  appVersion?: string
  installationId?: string
  instanceId?: string
  fuseauHoraire?: string
}

export namespace ConfigurationApplication {
  export interface AMettreAJour {
    pushNotificationToken?: string
    dateDerniereActualisationToken?: Date
    appVersion?: string
    installationId?: string
    instanceId?: string
    fuseauHoraire?: string
  }

  export interface Repository {
    get(idJeune: string): Promise<ConfigurationApplication | undefined>

    save(configurationApplication: ConfigurationApplication): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(private dateService: DateService) {}

    creer(
      idJeune: string,
      aMettreAJour: AMettreAJour
    ): ConfigurationApplication {
      return {
        idJeune: idJeune,
        pushNotificationToken: aMettreAJour.pushNotificationToken,
        dateDerniereActualisationToken: this.dateService.nowJs(),
        installationId: aMettreAJour.installationId,
        instanceId: aMettreAJour.instanceId,
        appVersion: aMettreAJour.appVersion,
        fuseauHoraire: aMettreAJour.fuseauHoraire
      }
    }

    mettreAJour(
      configuration: ConfigurationApplication,
      aMettreAJour: AMettreAJour
    ): ConfigurationApplication {
      return {
        idJeune: configuration.idJeune,
        pushNotificationToken:
          aMettreAJour.pushNotificationToken ??
          configuration.pushNotificationToken,
        dateDerniereActualisationToken: aMettreAJour.pushNotificationToken
          ? this.dateService.nowJs()
          : configuration.dateDerniereActualisationToken,
        installationId:
          aMettreAJour.installationId ?? configuration.installationId,
        instanceId: aMettreAJour.instanceId ?? configuration.instanceId,
        appVersion: aMettreAJour.appVersion ?? configuration.appVersion,
        fuseauHoraire: aMettreAJour.fuseauHoraire ?? configuration.fuseauHoraire
      }
    }
  }
}
