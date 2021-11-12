import { ConseillerDto } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'

export function unConseillerDto(
  args: Partial<AsSql<ConseillerDto>> = {}
): AsSql<ConseillerDto> {
  const defaults: AsSql<ConseillerDto> = {
    id: '1',
    prenom: 'Nils',
    nom: 'Tavernier'
  }

  return { ...defaults, ...args }
}
