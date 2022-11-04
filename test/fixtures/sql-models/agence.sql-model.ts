import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { AgenceDto } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { Core } from '../../../src/domain/core'
import Structure = Core.Structure

export function uneAgenceMiloDTO(
  args: Partial<AsSql<AgenceDto>> = {}
): AsSql<AgenceDto> {
  const defaults: AsSql<AgenceDto> = {
    id: '1',
    nomAgence: 'Mission Locale Aubenas',
    codeDepartement: '7',
    structure: Structure.MILO,
    nomRegion: 'Auvergne-Rhône-Alpes'
  }

  return { ...defaults, ...args }
}
