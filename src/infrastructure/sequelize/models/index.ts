import { ActionSqlModel } from './action.sql-model'
import { ConseillerSqlModel } from './conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from './favori-offre-emploi.sql-model'
import { JeuneSqlModel } from './jeune.sql-model'
import { RendezVousSqlModel } from './rendez-vous.sql-model'

export const sqlModels = [
  ConseillerSqlModel,
  JeuneSqlModel,
  ActionSqlModel,
  RendezVousSqlModel,
  FavoriOffreEmploiSqlModel
]
