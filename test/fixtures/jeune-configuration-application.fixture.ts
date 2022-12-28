import { Jeune } from '../../src/domain/jeune/jeune'
import { uneDatetime } from './date.fixture'

export const uneJeuneConfigurationApplication = (
  args: Partial<Jeune.ConfigurationApplication> = {}
): Jeune.ConfigurationApplication => {
  const defaults = {
    idJeune: 'ABCDE',
    pushNotificationToken: 'unToken',
    installationId: 'uneInstallationId',
    instanceId: 'uneInstanceId',
    appVersion: 'uneAppVersion',
    dateDerniereActualisationToken: uneDatetime().toJSDate(),
    fuseauHoraire: 'Europe/Paris'
  }
  return { ...defaults, ...args }
}
