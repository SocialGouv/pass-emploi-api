import { ActionSqlModel } from './action.sql-model'
import { CommuneSqlModel } from './commune.sql-model'
import { ConseillerSqlModel } from './conseiller.sql-model'
import { DepartementSqlModel } from './departement.sql-model'
import { EvenementEngagementSqlModel } from './evenement-engagement.sql-model'
import { FavoriOffreEmploiSqlModel } from './favori-offre-emploi.sql-model'
import { JeuneSqlModel } from './jeune.sql-model'
import { RendezVousSqlModel } from './rendez-vous.sql-model'

export const sqlModels = [
  ConseillerSqlModel,
  JeuneSqlModel,
  ActionSqlModel,
  RendezVousSqlModel,
  FavoriOffreEmploiSqlModel,
  CommuneSqlModel,
  DepartementSqlModel,
  EvenementEngagementSqlModel
]
