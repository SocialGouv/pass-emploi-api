import { StructureMiloDto } from '../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

export function uneStructureMiloDto(
  args: Partial<AsSql<StructureMiloDto>> = {}
): AsSql<StructureMiloDto> {
  const defaults: AsSql<StructureMiloDto> = {
    id: '1',
    nomOfficiel: '06-Nice',
    nomUsuel: 'Nice'
  }

  return { ...defaults, ...args }
}
