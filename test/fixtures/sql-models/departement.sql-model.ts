import { DepartementDto } from '../../../src/infrastructure/sequelize/models/departement.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

export function unDepartementDto(
  args: Partial<AsSql<DepartementDto>> = {}
): AsSql<DepartementDto> {
  const defaults: AsSql<DepartementDto> = {
    id: '12345',
    code: '12345',
    libelle: 'abcde'
  }
  return { ...defaults, ...args }
}
