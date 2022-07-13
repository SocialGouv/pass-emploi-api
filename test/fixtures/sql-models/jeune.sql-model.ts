import { Core } from '../../../src/domain/core'
import { JeuneDto } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

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
    pushNotificationToken: 'unToken',
    dateDerniereActualisationToken: null,
    email: 'john.doe@plop.io',
    structure: Core.Structure.MILO,
    idAuthentification: 'un-id',
    dateDerniereConnexion: null,
    idDossier: '1234',
    appVersion: null,
    partageFavoris: true
  }

  return { ...defaults, ...args }
}
