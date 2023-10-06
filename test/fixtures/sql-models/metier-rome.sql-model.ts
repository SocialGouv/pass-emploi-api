import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { MetierRomeDto } from '../../../src/infrastructure/sequelize/models/metier-rome.sql-model'

export function unMetierRomeDto(
  args: Partial<AsSql<MetierRomeDto>> = {}
): AsSql<MetierRomeDto> {
  const defaults: AsSql<MetierRomeDto> = {
    id: 12345,
    code: 'D1104',
    libelle: 'Pâtissier tourier / Pâtissière tourière',
    libelleSanitized: 'Patissier tourier / Patissière tourière',
    appellationCode: '11573'
  }
  return { ...defaults, ...args }
}
