import { CommuneDto } from '../../../src/infrastructure/sequelize/models/commune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

export function uneCommuneDto(
  args: Partial<AsSql<CommuneDto>> = {}
): AsSql<CommuneDto> {
  const defaults: AsSql<CommuneDto> = {
    id: '12345',
    code: '12345',
    libelle: 'abcde',
    codeDepartement: '123',
    codePostal: '12345',
    longitude: '-1.6774253445924194',
    latitude: '48.110198435350306'
  }
  return { ...defaults, ...args }
}
