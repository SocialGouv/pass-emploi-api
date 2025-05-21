import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { JeuneDto } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { uneDate } from '../date.fixture'

export function unJeuneDto(
  args: Partial<AsSql<JeuneDto>> = {}
): AsSql<JeuneDto> {
  const defaults: AsSql<JeuneDto> = {
    id: 'ABCDE',
    prenom: 'John',
    nom: 'Doe',
    idConseiller: '1',
    idConseillerInitial: undefined,
    dateCreation: new Date('2021-11-11T08:03:30.000Z'),
    datePremiereConnexion: new Date('2021-11-11T08:03:30.000Z'),
    dateFinCEJ: null,
    pushNotificationToken: 'token',
    dateDerniereActualisationToken: uneDate(),
    email: 'john.doe@plop.io',
    structure: Core.Structure.MILO,
    idAuthentification: 'un-id',
    dateDerniereConnexion: null,
    idPartenaire: '1234',
    appVersion: '1.8.1',
    installationId: '123456',
    instanceId: 'abcdef',
    partageFavoris: true,
    notificationsAlertesOffres: true,
    notificationsMessages: true,
    notificationsCreationActionConseiller: true,
    notificationsRendezVousSessions: true,
    notificationsRappelActions: true,
    timezone: 'Europe/Paris',
    idStructureMilo: null,
    dateSignatureCGU: null,
    dispositif: Jeune.Dispositif.CEJ,
    peutVoirLeComptageDesHeures: null
  }

  return { ...defaults, ...args }
}
