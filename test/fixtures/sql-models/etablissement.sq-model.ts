import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { AgenceDto } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { Core } from '../../../src/domain/core'

export function unEtablissementDto(
  args: Partial<AsSql<AgenceDto>> = {}
): AsSql<AgenceDto> {
  const defaults: AsSql<AgenceDto> = {
    id: '1',
    nomAgence: 'Paris',
    nomRegion: 'Île-de-France',
    codeDepartement: '75',
    structure: Core.Structure.MILO
  }

  return { ...defaults, ...args }
}
