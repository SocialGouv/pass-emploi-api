import { Authentification } from 'src/domain/authentification'
import { Core } from 'src/domain/core'
import { EvenementEngagementDto } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'

export function unEvenementEngagementDto(
  args: Partial<AsSql<EvenementEngagementDto>> = {}
): Partial<EvenementEngagementDto> {
  const defaults: Partial<EvenementEngagementDto> = {
    code: 'OFFRE_ALTERNANCE_SAUVEGARDEE',
    categorie: 'Offre',
    action: 'Favori',
    nom: 'Alternance',
    idUtilisateur: 'john',
    typeUtilisateur: Authentification.Type.JEUNE,
    structure: Core.Structure.MILO,
    dateEvenement: new Date('2020-10-10T10:10:10Z')
  }

  return { ...defaults, ...args }
}
