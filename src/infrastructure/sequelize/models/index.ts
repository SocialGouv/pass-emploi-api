import { ActionSqlModel } from './action.sql-model'
import { CommuneSqlModel } from './commune.sql-model'
import { ConseillerSqlModel } from './conseiller.sql-model'
import { DepartementSqlModel } from './departement.sql-model'
import { EvenementEngagementSqlModel } from './evenement-engagement.sql-model'
import { FavoriOffreEmploiSqlModel } from './favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from './favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from './favori-offre-immersion.sql-model'
import { FichierSqlModel } from './fichier.sql-model'
import { JeuneSqlModel } from './jeune.sql-model'
import { RendezVousSqlModel } from './rendez-vous.sql-model'
import { RechercheSqlModel } from './recherche.sql-model'
import { TransfertConseillerSqlModel } from './transfert-conseiller.sql-model'
import { SuperviseurSqlModel } from './superviseur.sql-model'
import { AgenceSqlModel } from './agence.sql-model'
import { RendezVousJeuneAssociationSqlModel } from './rendez-vous-jeune-association.model'
import { SituationsMiloSqlModel } from './situations-milo.sql-model'
import { CampagneSqlModel } from './campagne.sql-model'
import { ReponseCampagneSqlModel } from './reponse-campagne.sql-model'
import { ArchiveJeuneSqlModel } from './archive-jeune.sql-model'
import { CommentaireSqlModel } from './commentaire.sql-model'
import { LogApiPartenaireSqlModel } from './log-api-partenaire-sql.model'
import { SuggestionSqlModel } from './suggestion.sql-model'

export const sqlModels = [
  ConseillerSqlModel,
  JeuneSqlModel,
  ActionSqlModel,
  RendezVousSqlModel,
  FavoriOffreEmploiSqlModel,
  CommuneSqlModel,
  DepartementSqlModel,
  EvenementEngagementSqlModel,
  RechercheSqlModel,
  FavoriOffreImmersionSqlModel,
  TransfertConseillerSqlModel,
  SuperviseurSqlModel,
  FavoriOffreEngagementSqlModel,
  AgenceSqlModel,
  RendezVousJeuneAssociationSqlModel,
  SituationsMiloSqlModel,
  CampagneSqlModel,
  ReponseCampagneSqlModel,
  FichierSqlModel,
  ArchiveJeuneSqlModel,
  CommentaireSqlModel,
  LogApiPartenaireSqlModel,
  SuggestionSqlModel
]
