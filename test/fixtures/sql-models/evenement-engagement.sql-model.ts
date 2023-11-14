import { Authentification } from 'src/domain/authentification'
import { Core } from 'src/domain/core'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { EvenementEngagementHebdoDto } from '../../../src/infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'

export function unEvenementEngagementDto(
  args: Partial<AsSql<EvenementEngagementHebdoDto>> = {}
): Partial<EvenementEngagementHebdoDto> {
  const defaults: Partial<EvenementEngagementHebdoDto> = {
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
