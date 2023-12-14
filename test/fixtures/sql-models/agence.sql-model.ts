import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { AgenceDto } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { Core } from '../../../src/domain/core'
import Structure = Core.Structure

export function uneAgenceMiloDto(
  args: Partial<AsSql<AgenceDto>> = {}
): AsSql<AgenceDto> {
  const defaults: AsSql<AgenceDto> = {
    id: '1',
    nomAgence: 'Mission Locale Aubenas',
    nomDepartement: null,
    codeDepartement: '07',
    structure: Structure.MILO,
    nomRegion: 'Auvergne-Rhône-Alpes',
    codeRegion: null,
    timezone: 'Europe/Paris'
  }

  return { ...defaults, ...args }
}

export function uneAgenceDto(
  args: Partial<AsSql<AgenceDto>> = {}
): AsSql<AgenceDto> {
  const defaults: AsSql<AgenceDto> = {
    id: '1',
    nomAgence: 'Nice',
    nomDepartement: null,
    codeDepartement: '6',
    structure: Structure.POLE_EMPLOI,
    nomRegion: 'PACA',
    codeRegion: null,
    timezone: 'Europe/Paris'
  }

  return { ...defaults, ...args }
}
