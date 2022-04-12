import { Authentification } from 'src/domain/authentification'
import { Core } from 'src/domain/core'
import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'

export function unEvenementEngagement(
  args: Partial<AsSql<EvenementEngagementSqlModel>> = {}
): AsSql<EvenementEngagementSqlModel> {
  const defaults: AsSql<EvenementEngagementSqlModel> = {
    id: 1,
    categorie: '1',
    action: '',
    nom: '',
    idUtilisateur: '',
    typeUtilisateur: Authentification.Type.JEUNE,
    structure: Core.Structure.MILO,
    dateEvenement: new Date('2020-10-10T10:10:10Z')
  }

  return { ...defaults, ...args }
}
