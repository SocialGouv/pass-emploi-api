import { Jeune } from '../../src/domain/jeune/jeune'
import { uneDatetime } from './date.fixture'

export const uneJeuneConfigurationApplication = (
  args: Partial<Jeune.ConfigurationApplication> = {}
): Jeune.ConfigurationApplication => {
  const defaults = {
    idJeune: 'ABCDE',
    pushNotificationToken: 'unToken',
    installationId: 'uneInstallationId',
    appVersion: 'uneAppVersion',
    dateDerniereActualisationToken: uneDatetime.toJSDate()
  }
  return { ...defaults, ...args }
}
