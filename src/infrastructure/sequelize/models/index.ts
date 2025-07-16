import { JeuneMiloAArchiverSqlModel } from './jeune-milo-a-archiver.sql-model'
import { ActionSqlModel } from './action.sql-model'
import { CommuneSqlModel } from './commune.sql-model'
import { ConseillerSqlModel } from './conseiller.sql-model'
import { DepartementSqlModel } from './departement.sql-model'
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
import { RendezVousJeuneAssociationSqlModel } from './rendez-vous-jeune-association.sql-model'
import { SituationsMiloSqlModel } from './situations-milo.sql-model'
import { CampagneSqlModel } from './campagne.sql-model'
import { ReponseCampagneSqlModel } from './reponse-campagne.sql-model'
import { ArchiveJeuneSqlModel } from './archive-jeune.sql-model'
import { CommentaireSqlModel } from './commentaire.sql-model'
import { CacheApiPartenaireSqlModel } from './cache-api-partenaire.sql-model'
import { SuggestionSqlModel } from './suggestion.sql-model'
import { MetierRomeSqlModel } from './metier-rome.sql-model'
import { LogModificationRendezVousSqlModel } from './log-modification-rendez-vous-sql.model'
import { ListeDeDiffusionSqlModel } from './liste-de-diffusion.sql-model'
import { ListeDeDiffusionJeuneAssociationSqlModel } from './liste-de-diffusion-jeune-association.sql-model'
import { SuiviJobSqlModel } from './suivi-job.sql-model'
import { SuiviPeCejSqlModel } from './suivi-pe-cej.sql-model'
import { EvenementEngagementHebdoSqlModel } from './evenement-engagement-hebdo.sql-model'
import { StructureMiloSqlModel } from './structure-milo.sql-model'
import { SessionMiloSqlModel } from './session-milo.sql-model'
import { NotificationJeuneSqlModel } from './notification-jeune.sql-model'
import { ComptageJeuneSqlModel } from './comptage-jeune.sql-model'

export const sqlModels = [
  ConseillerSqlModel,
  JeuneSqlModel,
  ActionSqlModel,
  RendezVousSqlModel,
  FavoriOffreEmploiSqlModel,
  CommuneSqlModel,
  DepartementSqlModel,
  EvenementEngagementHebdoSqlModel,
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
  CacheApiPartenaireSqlModel,
  SuiviJobSqlModel,
  SuggestionSqlModel,
  MetierRomeSqlModel,
  LogModificationRendezVousSqlModel,
  ListeDeDiffusionSqlModel,
  ListeDeDiffusionJeuneAssociationSqlModel,
  SuiviPeCejSqlModel,
  StructureMiloSqlModel,
  SessionMiloSqlModel,
  JeuneMiloAArchiverSqlModel,
  NotificationJeuneSqlModel,
  ComptageJeuneSqlModel
]
