import { Authentification } from 'src/domain/authentification'
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
    dateCreation: new Date('2021-11-11T08:03:30.000Z'),
    pushNotificationToken: null,
    dateDerniereActualisationToken: null,
    email: null,
    structure: Authentification.Structure.PASS_EMPLOI,
    idAuthentification: ''
  }

  return { ...defaults, ...args }
}
