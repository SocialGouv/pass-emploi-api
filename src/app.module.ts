/* eslint-disable no-process-env */
import { HttpModule } from '@nestjs/axios'
import { Module, ModuleMetadata, Provider } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { TerminusModule } from '@nestjs/terminus'
import { ActionAuthorizer } from './application/authorizers/authorize-action'
import { ConseillerAuthorizer } from './application/authorizers/authorize-conseiller'
import { ConseillerForJeuneAuthorizer } from './application/authorizers/authorize-conseiller-for-jeune'
import { AuthorizeConseillerForJeunes } from './application/authorizers/authorize-conseiller-for-jeunes'
import { FavoriOffresEmploiAuthorizer } from './application/authorizers/authorize-favori-offres-emploi'
import { FavoriOffreServiceCiviqueAuthorizer } from './application/authorizers/authorize-favori-offres-engagement'
import { FavoriOffresImmersionAuthorizer } from './application/authorizers/authorize-favori-offres-immersion'
import { JeuneAuthorizer } from './application/authorizers/authorize-jeune'
import { JeunePoleEmploiAuthorizer } from './application/authorizers/authorize-jeune-pole-emploi'
import { RechercheAuthorizer } from './application/authorizers/authorize-recherche'
import { RendezVousAuthorizer } from './application/authorizers/authorize-rendezvous'
import { SupportAuthorizer } from './application/authorizers/authorize-support'
import { AddFavoriOffreEmploiCommandHandler } from './application/commands/add-favori-offre-emploi.command.handler'
import { AddFavoriOffreServiceCiviqueCommandHandler } from './application/commands/add-favori-offre-service-civique-command-handler'
import { AddFavoriOffreImmersionCommandHandler } from './application/commands/add-favori-offre-immersion.command.handler'
import { CreateActionCommandHandler } from './application/commands/action/create-action.command.handler'
import { CreateEvenementCommandHandler } from './application/commands/create-evenement.command.handler'
import { CreateRechercheCommandHandler } from './application/commands/create-recherche.command.handler'
import { CreateRendezVousCommandHandler } from './application/commands/create-rendez-vous.command.handler'
import { CreerJeuneMiloCommandHandler } from './application/commands/creer-jeune-milo.command.handler'
import { CreerJeunePoleEmploiCommandHandler } from './application/commands/creer-jeune-pole-emploi.command.handler'
import { CreerSuperviseursCommandHandler } from './application/commands/creer-superviseurs.command.handler'
import { DeleteActionCommandHandler } from './application/commands/action/delete-action.command.handler'
import { DeleteFavoriOffreEmploiCommandHandler } from './application/commands/delete-favori-offre-emploi.command.handler'
import { DeleteFavoriOffreServiceCiviqueCommandHandler } from './application/commands/delete-favori-offre-service-civique.command.handler'
import { DeleteFavoriOffreImmersionCommandHandler } from './application/commands/delete-favori-offre-immersion.command.handler'
import { DeleteJeuneInactifCommandHandler } from './application/commands/delete-jeune-inactif.command.handler'
import { DeleteListeDeDiffusionCommandHandler } from './application/commands/delete-liste-de-diffusion.command.handler'
import { DeleteRechercheCommandHandler } from './application/commands/delete-recherche.command.handler'
import { DeleteRendezVousCommandHandler } from './application/commands/delete-rendez-vous.command.handler'
import { DeleteSuperviseursCommandHandler } from './application/commands/delete-superviseurs.command.handler'
import { EnvoyerMessageGroupeCommandHandler } from './application/commands/envoyer-message-groupe.command.handler'
import { HandleJobMailConseillerCommandHandler } from './application/commands/jobs/handle-job-mail-conseiller.command'
import { HandleNettoyerLesJobsCommandHandler } from './application/commands/jobs/handle-job-nettoyer-les-jobs.command'
import { HandleJobRappelRendezVousCommandHandler } from './application/commands/jobs/handle-job-rappel-rendez-vous.command'
import { HandleJobUpdateMailingListConseillerCommandHandler } from './application/commands/jobs/handle-job-update-mailing-list-conseiller.command'
import { NotifierNouvellesImmersionsCommandHandler } from './application/commands/notifier-nouvelles-immersions.command.handler'
import { SendNotificationsNouveauxMessagesCommandHandler } from './application/commands/send-notifications-nouveaux-messages.command.handler'
import { PlanifierExecutionCronCommandHandler } from './application/commands/tasks/planifier-execution-cron.command.handler'
import { InitCronsCommandHandler } from './application/commands/tasks/init-crons.command'
import { SynchronizeJobsCommandHandler } from './application/commands/tasks/synchronize-jobs.command'
import { TransfererJeunesConseillerCommandHandler } from './application/commands/transferer-jeunes-conseiller.command.handler'
import { UpdateJeuneConfigurationApplicationCommandHandler } from './application/commands/update-jeune-configuration-application.command.handler'
import { UpdateStatutActionCommandHandler } from './application/commands/action/update-statut-action.command.handler'
import { UpdateUtilisateurCommandHandler } from './application/commands/update-utilisateur.command.handler'
import { TeleverserFichierCommandHandler } from './application/commands/televerser-fichier.command.handler'
import { GetActionsPredefiniesQueryHandler } from './application/queries/action/get-actions-predefinies.query.handler'
import { GetJeunesByEtablissementQueryHandler } from './application/queries/get-jeunes-by-etablissement.query.handler.db'
import { Context } from './building-blocks/context'
import { GetActionsByJeuneQueryHandler } from './application/queries/action/get-actions-par-id-jeune.query.handler.db'
import { GetChatSecretsQueryHandler } from './application/queries/get-chat-secrets.query.handler'
import { GetCommunesEtDepartementsQueryHandler } from './application/queries/get-communes-et-departements.query.handler.db'
import { GetConseillerByEmailQueryHandler } from './application/queries/get-conseiller-by-email.query.handler.db'
import { GetConseillersJeuneQueryHandler } from './application/queries/get-conseillers-jeune.query.handler.db'
import { GetDetailActionQueryHandler } from './application/queries/action/get-detail-action.query.handler.db'
import { GetDetailConseillerQueryHandler } from './application/queries/get-detail-conseiller.query.handler.db'
import { GetDetailJeuneQueryHandler } from './application/queries/get-detail-jeune.query.handler.db'
import { GetDetailOffreEmploiQueryHandler } from './application/queries/get-detail-offre-emploi.query.handler'
import { GetDetailOffreImmersionQueryHandler } from './application/queries/get-detail-offre-immersion.query.handler'
import { GetDetailRendezVousQueryHandler } from './application/queries/rendez-vous/get-detail-rendez-vous.query.handler.db'
import { GetDetailOffreServiceCiviqueQueryHandler } from './application/queries/get-detail-offre-service-civique.query.handler'
import { GetDossierMiloJeuneQueryHandler } from './application/queries/get-dossier-milo-jeune.query.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from './application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { GetFavorisOffresImmersionJeuneQueryHandler } from './application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import { GetHomeJeuneHandler } from './application/queries/get-home-jeune.query.handler'
import { GetJeunesByConseillerQueryHandler } from './application/queries/get-jeunes-by-conseiller.query.handler.db'
import { GetOffresEmploiQueryHandler } from './application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQueryHandler } from './application/queries/get-offres-immersion.query.handler'
import { GetRecherchesQueryHandler } from './application/queries/get-recherches.query.handler.db'
import { GetAllRendezVousConseillerQueryHandler } from './application/queries/rendez-vous/get-rendez-vous-conseiller.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from './application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { GetRendezVousJeuneQueryHandler } from './application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import { GetResumeActionsDesJeunesDuConseillerQueryHandlerDb } from './application/queries/action/get-resume-actions-des-jeunes-du-conseiller.query.handler.db'
import { GetOffresServicesCiviqueQueryHandler } from './application/queries/get-offres-services-civique.query.handler'
import { GetTypesRendezVousQueryHandler } from './application/queries/rendez-vous/get-types-rendez-vous.query.handler'
import { TaskService } from './application/task.service'
import { WorkerService } from './application/worker.service.db'
import configuration from './config/configuration'
import {
  Action,
  ActionMiloRepositoryToken,
  ActionsRepositoryToken,
  CommentaireActionRepositoryToken
} from './domain/action/action'
import {
  Authentification,
  AuthentificationRepositoryToken
} from './domain/authentification'
import { ChatRepositoryToken } from './domain/chat'
import {
  Conseiller,
  ConseillersRepositoryToken
} from './domain/conseiller/conseiller'
import { EvenementService, EvenementsRepositoryToken } from './domain/evenement'
import { Fichier, FichierRepositoryToken } from './domain/fichier'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken,
  JeunePoleEmploiRepositoryToken,
  JeunesRepositoryToken
} from './domain/jeune/jeune'
import {
  Notification,
  NotificationRepositoryToken
} from './domain/notification/notification'
import { OffresEmploiRepositoryToken } from './domain/offre/favori/offre-emploi'
import { OffreServiceCiviqueRepositoryToken } from './domain/offre/favori/offre-service-civique'
import { FavorisOffresImmersionRepositoryToken } from './domain/offre/favori/offre-immersion'
import {
  PlanificateurRepositoryToken,
  PlanificateurService
} from './domain/planificateur'
import {
  Recherche,
  RecherchesRepositoryToken
} from './domain/offre/recherche/recherche'
import {
  RendezVous,
  RendezVousRepositoryToken
} from './domain/rendez-vous/rendez-vous'
import { SuperviseursRepositoryToken } from './domain/superviseur'
import { SuiviJobServiceToken } from './domain/suivi-job'
import { ApiKeyAuthGuard } from './infrastructure/auth/api-key.auth-guard'
import { JwtService } from './infrastructure/auth/jwt.service'
import { OidcAuthGuard } from './infrastructure/auth/oidc.auth-guard'
import { EngagementClient } from './infrastructure/clients/engagement-client'
import { FirebaseClient } from './infrastructure/clients/firebase-client'
import { ImmersionClient } from './infrastructure/clients/immersion-client'
import { KeycloakClient } from './infrastructure/clients/keycloak-client'
import { MailSendinblueService } from './infrastructure/clients/mail-sendinblue.service'
import { ObjectStorageClient } from './infrastructure/clients/object-storage.client'
import { PoleEmploiClient } from './infrastructure/clients/pole-emploi-client'
import { SuiviJobService } from './infrastructure/clients/suivi-job.service.db'
import { ActionSqlRepository } from './infrastructure/repositories/action/action-sql.repository.db'
import { AuthentificationSqlRepository } from './infrastructure/repositories/authentification-sql.repository.db'
import { ChatFirebaseRepository } from './infrastructure/repositories/chat-firebase.repository'
import { ConseillerSqlRepository } from './infrastructure/repositories/conseiller-sql.repository.db'
import { EvenementSqlRepository } from './infrastructure/repositories/evenement-sql.repository.db'
import { FichierSqlS3Repository } from './infrastructure/repositories/fichier-sql-s3.repository.db'
import { JeuneConfigurationApplicationSqlRepository } from './infrastructure/repositories/jeune/jeune-configuration-application-sql.repository.db'
import { JeuneSqlRepository } from './infrastructure/repositories/jeune/jeune-sql.repository.db'
import { MailSqlRepository } from './infrastructure/repositories/mail-sql.repository.db'
import { MiloJeuneHttpSqlRepository } from './infrastructure/repositories/jeune/jeune-milo-http-sql.repository.db'
import { NotificationFirebaseRepository } from './infrastructure/repositories/notification-firebase.repository'
import { OffresEmploiHttpSqlRepository } from './infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { OffreServiceCiviqueHttpSqlRepository } from './infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { FavorisOffresImmersionSqlRepository } from './infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { PlanificateurRedisRepository } from './infrastructure/repositories/planificateur-redis.repository.db'
import { RechercheSqlRepository } from './infrastructure/repositories/offre/recherche/recherche-sql.repository.db'
import { RendezVousRepositorySql } from './infrastructure/repositories/rendez-vous/rendez-vous-sql.repository.db'
import { SuperviseurSqlRepository } from './infrastructure/repositories/superviseur-sql.repository.db'
import { ActionsController } from './infrastructure/routes/actions.controller'
import { AuthentificationController } from './infrastructure/routes/authentification.controller'
import { ConseillersController } from './infrastructure/routes/conseillers.controller'
import { EvenementsController } from './infrastructure/routes/evenements.controller'
import { FavorisController } from './infrastructure/routes/favoris.controller'
import { HealthController } from './infrastructure/routes/health.controller'
import { JeunesController } from './infrastructure/routes/jeunes.controller'
import { JeunesControllerV2 } from './infrastructure/routes/v2/jeunes.controller.v2'
import { ConseillersControllerV2 } from './infrastructure/routes/v2/conseillers.controller.v2'
import { OffresEmploiController } from './infrastructure/routes/offres-emploi.controller'
import { OffresImmersionController } from './infrastructure/routes/offres-immersion.controller'
import { RecherchesJeunesController } from './infrastructure/routes/recherches-jeunes.controller'
import { RecherchesConseillersController } from './infrastructure/routes/recherches-conseillers.controller'
import { ReferentielsController } from './infrastructure/routes/referentiels.controller'
import { RendezVousController } from './infrastructure/routes/rendez-vous.controller'
import { ServicesCiviqueController } from './infrastructure/routes/services-civique.controller'
import { databaseProviders } from './infrastructure/sequelize/providers'
import { DateService } from './utils/date-service'
import { IdService } from './utils/id-service'
import { configureLoggerModule } from './utils/logger.module'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken,
  PoleEmploiPartenaireInMemoryClient
} from './infrastructure/clients/pole-emploi-partenaire-client'
import { GetDemarchesQueryHandler } from './application/queries/get-demarches.query.handler'
import { GetJeuneMiloByDossierQueryHandler } from './application/queries/get-jeune-milo-by-dossier.query.handler.db'
import { UpdateRendezVousCommandHandler } from './application/commands/update-rendez-vous.command.handler'
import { InvitationIcsClient } from './infrastructure/clients/invitation-ics.client'
import { Mail, MailRepositoryToken, MailServiceToken } from './domain/mail'
import { ChatCryptoService } from './utils/chat-crypto-service'
import { DeleteJeuneCommandHandler } from './application/commands/delete-jeune.command.handler'
import { AgenceRepositoryToken } from './domain/agence'
import { AgenceSqlRepository } from './infrastructure/repositories/agence-sql.repository.db'
import { GetAgencesQueryHandler } from './application/queries/get-agences.query.handler.db'
import { ModifierConseillerCommandHandler } from './application/commands/modifier-conseiller.command.handler'
import { HandleJobNotifierNouvellesOffresEmploiCommandHandler } from './application/commands/jobs/handle-job-notifier-nouvelles-offres-emploi.command'
import { HandleJobNotifierNouveauxServicesCiviqueCommandHandler } from './application/commands/jobs/handle-job-notification-recherche-service-civique.command.handler'
import { GetFavorisServiceCiviqueJeuneQueryHandler } from './application/queries/get-favoris-service-civique-jeune.query.handler.db'
import { HandleJobRecupererSituationsJeunesMiloCommandHandler } from './application/commands/jobs/handle-job-recuperer-situations-jeunes-milo.command'
import { CampagnesController } from './infrastructure/routes/campagnes.controller'
import { Campagne, CampagneRepositoryToken } from './domain/campagne'
import { CampagneSqlRepository } from './infrastructure/repositories/campagne-sql.repository.db'
import { CreateCampagneCommandHandler } from './application/commands/create-campagne.command'
import { GetJeuneHomeDemarchesQueryHandler } from './application/queries/get-jeune-home-demarches.query.handler'
import { GetJeuneHomeActionsQueryHandler } from './application/queries/get-jeune-home-actions.query.handler'
import { GetCampagneQueryModel } from './application/queries/query-getters/get-campagne.query.getter'
import { CreateEvaluationCommandHandler } from './application/commands/create-evaluation.command'
import { DemarcheHttpRepository } from './infrastructure/repositories/demarche-http.repository'
import { Demarche, DemarcheRepositoryToken } from './domain/demarche'
import { UpdateStatutDemarcheCommandHandler } from './application/commands/update-demarche.command.handler'
import { CreateDemarcheCommandHandler } from './application/commands/create-demarche.command.handler'
import { RechercherTypesDemarcheQueryHandler } from './application/queries/rechercher-types-demarche.query.handler'
import { FilesController } from './infrastructure/routes/fichiers.controller'
import { TelechargerFichierQueryHandler } from './application/queries/telecharger-fichier.query.handler'
import { SupprimerFichierCommandHandler } from './application/commands/supprimer-fichier.command.handler'
import { FichierTelechargementAuthorizer } from './application/authorizers/authorize-fichier-telechargement'
import { FindAllOffresEmploiQueryGetter } from './application/queries/query-getters/find-all-offres-emploi.query.getter'
import { FindAllOffresImmersionQueryGetter } from './application/queries/query-getters/find-all-offres-immersion.query.getter'
import { FindAllOffresServicesCiviqueQueryGetter } from './application/queries/query-getters/find-all-offres-services-civique.query.getter'
import { RecupererJeunesDuConseillerCommandHandler } from './application/commands/recuperer-jeunes-du-conseiller.command.handler'
import { HandleJobNettoyerPiecesJointesCommandHandler } from './application/commands/jobs/handle-job-nettoyer-pieces-jointes.command'
import { ArchiverJeuneCommandHandler } from './application/commands/archiver-jeune.command.handler'
import { ArchiveJeuneRepositoryToken } from './domain/archive-jeune'
import { ArchiveJeuneSqlRepository } from './infrastructure/repositories/archive-jeune-sql.repository.db'
import { GetMotifsSuppressionJeuneQueryHandler } from './application/queries/get-motifs-suppression-jeune.query.handler'
import { RateLimiterService } from './utils/rate-limiter.service'
import { UpdateJeunePreferencesCommandHandler } from './application/commands/update-preferences-jeune.command.handler'
import { GetPreferencesJeuneQueryHandler } from './application/queries/get-preferences-jeune.handler.db'
import { GetRendezVousConseillerPaginesQueryHandler } from './application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { ConseillerForJeuneAvecPartageAuthorizer } from './application/authorizers/authorize-conseiller-for-jeune-avec-partage'
import { GetFavorisJeunePourConseillerQueryHandler } from './application/queries/get-favoris-jeune-pour-conseiller.query.handler.db'
import { GetMetadonneesFavorisJeuneQueryHandler } from './application/queries/get-metadonnees-favoris-jeune.query.handler.db'
import { HandleJobRappelActionCommandHandler } from './application/commands/jobs/handle-job-rappel-action.command'
import { AddCommentaireActionCommandHandler } from './application/commands/action/add-commentaire-action.command.handler'
import { FichierSuppressionAuthorizer } from './application/authorizers/authorize-fichier-suppression'
import { ModifierJeuneDuConseillerCommandHandler } from './application/commands/modifier-jeune-du-conseiller.command.handler'
import { CommentaireActionSqlRepositoryDb } from './infrastructure/repositories/action/commentaire-action-sql.repository.db'
import { GetCommentairesActionQueryHandler } from './application/queries/action/get-commentaires-action.query.handler.db'
import { HandleJobNotifierRendezVousPECommandHandler } from './application/commands/jobs/handle-job-notifier-rendez-vous-pe.command'
import { GetJeuneHomeAgendaQueryHandler } from './application/queries/get-jeune-home-agenda.query.db'
import { JeunePoleEmploiSqlRepository } from './infrastructure/repositories/jeune/jeune-pole-emploi-sql.repository.db'
import { GetTypesQualificationsQueryHandler } from './application/queries/action/get-types-qualifications.query.handler'
import { ActionMiloHttpRepository } from './infrastructure/repositories/action/action-milo-http-sql.repository'
import { QualifierActionCommandHandler } from './application/commands/action/qualifier-action.command.handler'
import { GetJeuneHomeAgendaPoleEmploiQueryHandler } from './application/queries/get-jeune-home-agenda-pole-emploi.query.handler'
import { GetDemarchesQueryGetter } from './application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from './application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { HandleJobMettreAJourCodesEvenementsCommandHandler } from './application/commands/jobs/handle-job-mettre-a-jour-codes-evenements.command'
import { GetIndicateursPourConseillerQueryHandler } from './application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { HandleJobNettoyerLesDonneesCommandHandler } from './application/commands/jobs/handle-job-nettoyer-les-donnees.command.db'
import { RafraichirSuggestionPoleEmploiCommandHandler } from './application/commands/rafraichir-suggestion-pole-emploi.command.handler'
import { SuggestionPeHttpRepository } from './infrastructure/repositories/offre/recherche/suggestion/suggestion-pe-http.repository.db'
import {
  Suggestion,
  SuggestionsPoleEmploiRepositoryToken,
  SuggestionsRepositoryToken
} from './domain/offre/recherche/suggestion/suggestion'
import { SuggestionSqlRepository } from './infrastructure/repositories/offre/recherche/suggestion/suggestion-sql.repository.db'
import { GetSuggestionsQueryHandler } from './application/queries/get-suggestions.query.handler.db'
import { SuggestionPoleEmploiService } from './domain/offre/recherche/suggestion/pole-emploi.service'
import { RefuserSuggestionCommandHandler } from './application/commands/refuser-suggestion.command.handler'
import { CreateRechercheFromSuggestionCommandHandler } from './application/commands/create-recherche-from-suggestion.command.handler'
import { SuggestionAuthorizer } from './application/authorizers/authorize-suggestion'
import { GetMetiersRomeQueryHandler } from './application/queries/get-metiers-rome.query.handler.db'
import { CreateSuggestionConseillerOffreEmploiCommandHandler } from './application/commands/create-suggestion-conseiller-offre-emploi.command.handler'
import { CreateSuggestionConseillerServiceCiviqueCommandHandler } from './application/commands/create-suggestion-conseiller-service-civique.command.handler'
import { CreateSuggestionConseillerImmersionCommandHandler } from './application/commands/create-suggestion-conseiller-immersion.command.handler'
import { ReferentielsControllerV2 } from './infrastructure/routes/v2/referentiels.controller.v2'
import { EtablissementsController } from './infrastructure/routes/etablissements.controller'
import { ConseillerEtablissementAuthorizer } from './application/authorizers/authorize-conseiller-etablissement'
import { AnimationCollectiveSqlRepository } from './infrastructure/repositories/rendez-vous/animation-collective-sql.repository.db'
import { HistoriqueRendezVousRepositorySql } from './infrastructure/repositories/rendez-vous/historique-rendez-vous.repository.db'
import { CloturerAnimationCollectiveCommandHandler } from './application/commands/cloturer-animation-collective.command.handler'
import { GetAnimationsCollectivesQueryHandler } from './application/queries/rendez-vous/get-animations-collectives.query.handler.db'
import { AnimationCollectiveRepositoryToken } from './domain/rendez-vous/animation-collective'
import { HistoriqueRendezVousRepositoryToken } from './domain/rendez-vous/historique'
import { GetAnimationsCollectivesJeuneQueryHandler } from './application/queries/rendez-vous/get-animations-collectives-jeune.query.handler.db'
import { GetUnRendezVousJeuneQueryHandler } from './application/queries/rendez-vous/get-un-rendez-vous-jeune.query.handler.db'
import { CreateListeDeDiffusionCommandHandler } from './application/commands/create-liste-de-diffusion.command.handler'
import { ListeDeDiffusionSqlRepository } from './infrastructure/repositories/conseiller/liste-de-diffusion-sql.repository.db'
import { ListeDeDiffusionRepositoryToken } from './domain/conseiller/liste-de-diffusion'
import { GetListesDeDiffusionDuConseillerQueryHandler } from './application/queries/get-listes-de-diffusion-du-conseiller.query.handler.db'
import { ListesDeDiffusionController } from './infrastructure/routes/listes-de-diffusion.controller'
import { AuthorizeConseillerForJeunesTransferesTemporairement } from './application/authorizers/authorize-conseiller-for-jeunes-transferes'
import { AuthorizeListeDeDiffusion } from './application/authorizers/authorize-liste-de-diffusion'
import { UpdateListeDeDiffusionCommandHandler } from './application/commands/update-liste-de-diffusion.command.handler'
import { GetDetailListeDeDiffusionQueryHandler } from './application/queries/get-detail-liste-de-diffusion.query.handler.db'
import { HandleJobAgenceAnimationCollectiveCommandHandler } from './application/commands/jobs/handle-job-agence-animation-collective.command.db'
import { MonitorJobsCommandHandler } from './application/commands/jobs/monitor-jobs.command.db'
import { HandleJobMettreAJourLesSegmentsCommandHandler } from './application/commands/jobs/handle-job-mettre-a-jour-les-segments.command.db'
import { BigqueryClient } from './infrastructure/clients/bigquery.client'
import { MessagesController } from './infrastructure/routes/messages.controller'
import { HandleJobGenererJDDCommandHandler } from './application/commands/jobs/handle-job-generer-jdd.handler'
import { SupportController } from './infrastructure/routes/support.controller'
import { RefreshJddCommandHandler } from './application/commands/refresh-jdd.command.handler'
import { SuivreEvenementsMiloCronJobHandler } from './application/cron-jobs/rendez-vous-milo/suivre-file-evenements-milo.handler'
import { MiloRendezVousHttpRepository } from './infrastructure/repositories/rendez-vous/rendez-vous-milo-http.repository'
import { TraiterEvenementMiloJobHandler } from './application/jobs/rendez-vous-milo/traiter-evenement-milo.handler'
import {
  RendezVousMilo,
  MiloRendezVousRepositoryToken
} from './domain/rendez-vous/rendez-vous.milo'
import { MiloJeuneRepositoryToken } from './domain/jeune/jeune.milo'
import { HandleJobFakeCommandHandler } from './application/commands/jobs/handle-job-fake.command'
import { MettreAJourLesJeunesCejPeCommandHandler } from './application/commands/mettre-a-jour-les-jeunes-cej-pe.command.handler'
import { ChangerAgenceCommandHandler } from './application/commands/changer-agence.command.handler'
import { GetActionsConseillerV2QueryHandler } from './application/queries/action/get-actions-conseiller-v2.query.handler.db'

export const buildModuleMetadata = (): ModuleMetadata => ({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      cache: true,
      load: [configuration]
    }),
    configureLoggerModule(),
    HttpModule.register({
      timeout: 5000
    }),
    TerminusModule
  ],
  controllers: [
    ActionsController,
    JeunesController,
    JeunesControllerV2,
    OffresEmploiController,
    OffresImmersionController,
    ConseillersController,
    ConseillersControllerV2,
    HealthController,
    RendezVousController,
    AuthentificationController,
    ReferentielsController,
    ReferentielsControllerV2,
    EvenementsController,
    RecherchesJeunesController,
    RecherchesConseillersController,
    FavorisController,
    ServicesCiviqueController,
    CampagnesController,
    FilesController,
    EtablissementsController,
    ListesDeDiffusionController,
    MessagesController,
    ListesDeDiffusionController,
    SupportController
  ],
  providers: [
    ...buildQueryCommandsProviders(),
    ...buildJobHandlerProviders(),
    FirebaseClient,
    OidcAuthGuard,
    ApiKeyAuthGuard,
    JwtService,
    IdService,
    DateService,
    ChatCryptoService,
    RateLimiterService,
    PoleEmploiClient,
    ImmersionClient,
    EngagementClient,
    ObjectStorageClient,
    Action.Factory,
    Action.Commentaire.Factory,
    Mail.Factory,
    Authentification.Factory,
    Campagne.Factory,
    Demarche.Factory,
    RendezVous.Historique.Factory,
    RendezVous.Factory,
    RendezVous.Service,
    Jeune.Factory,
    Jeune.ConfigurationApplication.Factory,
    Fichier.Factory,
    Suggestion.Factory,
    SuggestionPoleEmploiService,
    Notification.Service,
    RendezVous.AnimationCollective.Service,
    WorkerService,
    TaskService,
    InvitationIcsClient,
    KeycloakClient,
    Context,
    Recherche.Factory,
    Conseiller.ListeDeDiffusion.Factory,
    Conseiller.ListeDeDiffusion.Service,
    RendezVousMilo.Factory,
    BigqueryClient,
    {
      provide: APP_GUARD,
      useClass: OidcAuthGuard
    },
    {
      provide: ActionsRepositoryToken,
      useClass: ActionSqlRepository
    },
    {
      provide: JeunesRepositoryToken,
      useClass: JeuneSqlRepository
    },
    {
      provide: ConseillersRepositoryToken,
      useClass: ConseillerSqlRepository
    },
    {
      provide: OffresEmploiRepositoryToken,
      useClass: OffresEmploiHttpSqlRepository
    },
    {
      provide: NotificationRepositoryToken,
      useClass: NotificationFirebaseRepository
    },
    {
      provide: ChatRepositoryToken,
      useClass: ChatFirebaseRepository
    },
    {
      provide: MailServiceToken,
      useClass: MailSendinblueService
    },
    {
      provide: RendezVousRepositoryToken,
      useClass: RendezVousRepositorySql
    },
    {
      provide: AuthentificationRepositoryToken,
      useClass: AuthentificationSqlRepository
    },
    {
      provide: MiloJeuneRepositoryToken,
      useClass: MiloJeuneHttpSqlRepository
    },
    {
      provide: FavorisOffresImmersionRepositoryToken,
      useClass: FavorisOffresImmersionSqlRepository
    },
    {
      provide: PlanificateurRepositoryToken,
      useClass: PlanificateurRedisRepository
    },
    {
      provide: EvenementsRepositoryToken,
      useClass: EvenementSqlRepository
    },
    {
      provide: RecherchesRepositoryToken,
      useClass: RechercheSqlRepository
    },
    {
      provide: OffreServiceCiviqueRepositoryToken,
      useClass: OffreServiceCiviqueHttpSqlRepository
    },
    {
      provide: SuperviseursRepositoryToken,
      useClass: SuperviseurSqlRepository
    },
    {
      provide: AgenceRepositoryToken,
      useClass: AgenceSqlRepository
    },
    {
      provide: MailRepositoryToken,
      useClass: MailSqlRepository
    },
    {
      provide: CampagneRepositoryToken,
      useClass: CampagneSqlRepository
    },
    {
      provide: DemarcheRepositoryToken,
      useClass: DemarcheHttpRepository
    },
    {
      provide: FichierRepositoryToken,
      useClass: FichierSqlS3Repository
    },
    {
      provide: ArchiveJeuneRepositoryToken,
      useClass: ArchiveJeuneSqlRepository
    },
    {
      provide: SuiviJobServiceToken,
      useClass: SuiviJobService
    },
    {
      provide: JeuneConfigurationApplicationRepositoryToken,
      useClass: JeuneConfigurationApplicationSqlRepository
    },
    {
      provide: CommentaireActionRepositoryToken,
      useClass: CommentaireActionSqlRepositoryDb
    },
    {
      provide: JeunePoleEmploiRepositoryToken,
      useClass: JeunePoleEmploiSqlRepository
    },
    {
      provide: ActionMiloRepositoryToken,
      useClass: ActionMiloHttpRepository
    },
    {
      provide: SuggestionsPoleEmploiRepositoryToken,
      useClass: SuggestionPeHttpRepository
    },
    {
      provide: SuggestionsRepositoryToken,
      useClass: SuggestionSqlRepository
    },
    {
      provide: AnimationCollectiveRepositoryToken,
      useClass: AnimationCollectiveSqlRepository
    },
    {
      provide: HistoriqueRendezVousRepositoryToken,
      useClass: HistoriqueRendezVousRepositorySql
    },
    {
      provide: ListeDeDiffusionRepositoryToken,
      useClass: ListeDeDiffusionSqlRepository
    },
    {
      provide: MiloRendezVousRepositoryToken,
      useClass: MiloRendezVousHttpRepository
    },
    {
      provide: PoleEmploiPartenaireClientToken,
      useClass:
        process.env.IS_IN_MEMORY == 'true'
          ? PoleEmploiPartenaireInMemoryClient
          : PoleEmploiPartenaireClient
    },
    ...databaseProviders
  ],
  exports: [...databaseProviders]
})

export function buildQueryCommandsProviders(): Provider[] {
  return [
    ActionAuthorizer,
    ConseillerAuthorizer,
    FavoriOffresEmploiAuthorizer,
    FavoriOffresImmersionAuthorizer,
    JeuneAuthorizer,
    RechercheAuthorizer,
    ConseillerForJeuneAuthorizer,
    JeunePoleEmploiAuthorizer,
    RendezVousAuthorizer,
    SupportAuthorizer,
    SuggestionAuthorizer,
    AuthorizeConseillerForJeunes,
    AuthorizeConseillerForJeunesTransferesTemporairement,
    ConseillerForJeuneAvecPartageAuthorizer,
    FavoriOffreServiceCiviqueAuthorizer,
    ConseillerEtablissementAuthorizer,
    AuthorizeListeDeDiffusion,
    GetDetailActionQueryHandler,
    GetDetailJeuneQueryHandler,
    GetActionsByJeuneQueryHandler,
    CreateActionCommandHandler,
    CreerJeunePoleEmploiCommandHandler,
    AddFavoriOffreEmploiCommandHandler,
    AddFavoriOffreImmersionCommandHandler,
    DeleteFavoriOffreEmploiCommandHandler,
    DeleteFavoriOffreImmersionCommandHandler,
    GetFavorisOffresEmploiJeuneQueryHandler,
    GetFavorisOffresImmersionJeuneQueryHandler,
    GetHomeJeuneHandler,
    GetOffresEmploiQueryHandler,
    GetOffresImmersionQueryHandler,
    GetDetailOffreImmersionQueryHandler,
    GetDetailOffreEmploiQueryHandler,
    GetDetailConseillerQueryHandler,
    GetJeunesByConseillerQueryHandler,
    GetResumeActionsDesJeunesDuConseillerQueryHandlerDb,
    UpdateJeuneConfigurationApplicationCommandHandler,
    UpdateStatutActionCommandHandler,
    CreateRendezVousCommandHandler,
    DeleteRendezVousCommandHandler,
    GetAllRendezVousConseillerQueryHandler,
    GetRendezVousJeuneQueryHandler,
    GetRendezVousJeunePoleEmploiQueryHandler,
    SendNotificationsNouveauxMessagesCommandHandler,
    DeleteActionCommandHandler,
    CreateRechercheCommandHandler,
    GetRecherchesQueryHandler,
    DeleteRechercheCommandHandler,
    UpdateUtilisateurCommandHandler,
    GetCommunesEtDepartementsQueryHandler,
    GetDossierMiloJeuneQueryHandler,
    CreerJeuneMiloCommandHandler,
    PlanificateurService,
    EvenementService,
    CreateEvenementCommandHandler,
    GetChatSecretsQueryHandler,
    SynchronizeJobsCommandHandler,
    GetConseillerByEmailQueryHandler,
    TransfererJeunesConseillerCommandHandler,
    InitCronsCommandHandler,
    GetOffresServicesCiviqueQueryHandler,
    GetDetailOffreServiceCiviqueQueryHandler,
    CreerSuperviseursCommandHandler,
    DeleteSuperviseursCommandHandler,
    GetTypesRendezVousQueryHandler,
    NotifierNouvellesImmersionsCommandHandler,
    AddFavoriOffreServiceCiviqueCommandHandler,
    GetFavorisServiceCiviqueJeuneQueryHandler,
    DeleteFavoriOffreServiceCiviqueCommandHandler,
    DeleteJeuneCommandHandler,
    DeleteJeuneInactifCommandHandler,
    GetDetailRendezVousQueryHandler,
    GetDemarchesQueryHandler,
    GetJeuneMiloByDossierQueryHandler,
    UpdateRendezVousCommandHandler,
    GetConseillersJeuneQueryHandler,
    GetAgencesQueryHandler,
    ModifierConseillerCommandHandler,
    CreateCampagneCommandHandler,
    GetJeuneHomeDemarchesQueryHandler,
    GetJeuneHomeActionsQueryHandler,
    GetCampagneQueryModel,
    CreateEvaluationCommandHandler,
    UpdateStatutDemarcheCommandHandler,
    CreateDemarcheCommandHandler,
    RechercherTypesDemarcheQueryHandler,
    TeleverserFichierCommandHandler,
    TelechargerFichierQueryHandler,
    SupprimerFichierCommandHandler,
    FichierTelechargementAuthorizer,
    FindAllOffresEmploiQueryGetter,
    FindAllOffresImmersionQueryGetter,
    FindAllOffresServicesCiviqueQueryGetter,
    RecupererJeunesDuConseillerCommandHandler,
    FichierSuppressionAuthorizer,
    ArchiverJeuneCommandHandler,
    GetMotifsSuppressionJeuneQueryHandler,
    PlanifierExecutionCronCommandHandler,
    UpdateJeunePreferencesCommandHandler,
    GetPreferencesJeuneQueryHandler,
    GetMetadonneesFavorisJeuneQueryHandler,
    ModifierJeuneDuConseillerCommandHandler,
    GetFavorisJeunePourConseillerQueryHandler,
    AddCommentaireActionCommandHandler,
    GetCommentairesActionQueryHandler,
    GetJeuneHomeAgendaQueryHandler,
    GetRendezVousConseillerPaginesQueryHandler,
    GetTypesQualificationsQueryHandler,
    QualifierActionCommandHandler,
    GetJeuneHomeAgendaPoleEmploiQueryHandler,
    GetDemarchesQueryGetter,
    GetRendezVousJeunePoleEmploiQueryGetter,
    GetIndicateursPourConseillerQueryHandler,
    RafraichirSuggestionPoleEmploiCommandHandler,
    GetSuggestionsQueryHandler,
    RefuserSuggestionCommandHandler,
    CreateRechercheFromSuggestionCommandHandler,
    GetMetiersRomeQueryHandler,
    CreateSuggestionConseillerOffreEmploiCommandHandler,
    CreateSuggestionConseillerServiceCiviqueCommandHandler,
    CreateSuggestionConseillerImmersionCommandHandler,
    GetActionsPredefiniesQueryHandler,
    GetAnimationsCollectivesQueryHandler,
    GetJeunesByEtablissementQueryHandler,
    CloturerAnimationCollectiveCommandHandler,
    GetAnimationsCollectivesJeuneQueryHandler,
    GetUnRendezVousJeuneQueryHandler,
    CreateListeDeDiffusionCommandHandler,
    GetListesDeDiffusionDuConseillerQueryHandler,
    UpdateListeDeDiffusionCommandHandler,
    DeleteListeDeDiffusionCommandHandler,
    GetDetailListeDeDiffusionQueryHandler,
    RefreshJddCommandHandler,
    EnvoyerMessageGroupeCommandHandler,
    MettreAJourLesJeunesCejPeCommandHandler,
    ChangerAgenceCommandHandler,
    GetActionsConseillerV2QueryHandler
  ]
}

export function buildJobHandlerProviders(): Provider[] {
  return JobHandlerProviders
}

export const JobHandlerProviders = [
  HandleNettoyerLesJobsCommandHandler,
  HandleJobFakeCommandHandler,
  HandleJobRappelRendezVousCommandHandler,
  HandleJobRappelActionCommandHandler,
  HandleJobMailConseillerCommandHandler,
  HandleJobNotifierNouvellesOffresEmploiCommandHandler,
  HandleJobRecupererSituationsJeunesMiloCommandHandler,
  HandleJobAgenceAnimationCollectiveCommandHandler,
  HandleJobMettreAJourCodesEvenementsCommandHandler,
  HandleJobNotifierRendezVousPECommandHandler,
  HandleJobNettoyerPiecesJointesCommandHandler,
  HandleJobUpdateMailingListConseillerCommandHandler,
  HandleJobNotifierNouveauxServicesCiviqueCommandHandler,
  HandleJobNettoyerLesDonneesCommandHandler,
  HandleJobMettreAJourLesSegmentsCommandHandler,
  MonitorJobsCommandHandler,
  HandleJobGenererJDDCommandHandler,
  SuivreEvenementsMiloCronJobHandler,
  TraiterEvenementMiloJobHandler
]

@Module(buildModuleMetadata())
export class AppModule {}
