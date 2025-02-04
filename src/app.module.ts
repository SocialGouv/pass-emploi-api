/* eslint-disable no-process-env */
import { HttpModule } from '@nestjs/axios'
import {
  MiddlewareConsumer,
  Module,
  ModuleMetadata,
  NestModule,
  Provider,
  RequestMethod
} from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { TerminusModule } from '@nestjs/terminus'
import { EmargerSessionMiloCommandHandler } from 'src/application/commands/milo/emarger-session-milo.command.handler'
import { GetTokenPoleEmploiQueryHandler } from 'src/application/queries/get-token-pole-emploi.query.handler'
import { GetAgendaSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { GetCompteursBeneficiaireMiloQueryHandler } from 'src/application/queries/milo/get-compteurs-portefeuille-milo.query.handler.db'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { GetDetailSessionJeuneMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-jeune.milo.query.handler.db'
import { GetMonSuiviPoleEmploiQueryHandler } from 'src/application/queries/milo/get-mon-suivi-jeune.pole-emploi.query.handler.db'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import { GetSessionsJeuneMiloQueryHandler } from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler.db'
import { EvenementEmploiCodePostalQueryGetter } from 'src/application/queries/query-getters/evenement-emploi-code-postal.query.getter'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import { RechercherMessageQueryHandler } from 'src/application/queries/rechercher-message.query.handler'
import { AntivirusClient } from 'src/infrastructure/clients/antivirus-client'
import { AppMobileCacheControlMiddleware } from 'src/infrastructure/middlewares/app-mobile-cache-control.middleware'
import { ActionAuthorizer } from './application/authorizers/action-authorizer'
import { ConseillerAuthorizer } from './application/authorizers/conseiller-authorizer'
import { ConseillerInterAgenceAuthorizer } from './application/authorizers/conseiller-inter-agence-authorizer'
import { ConseillerInterStructureMiloAuthorizer } from './application/authorizers/conseiller-inter-structure-milo-authorizer'
import { FavoriOffresEmploiAuthorizer } from './application/authorizers/favori-offres-emploi-authorizer'
import { FavoriOffreServiceCiviqueAuthorizer } from './application/authorizers/favori-offres-engagement-authorizer'
import { FavoriOffresImmersionAuthorizer } from './application/authorizers/favori-offres-immersion-authorizer'
import { FichierAuthorizer } from './application/authorizers/fichier-authorizer'
import { JeuneAuthorizer } from './application/authorizers/jeune-authorizer'
import { ListeDeDiffusionAuthorizer } from './application/authorizers/liste-de-diffusion-authorizer'
import { RechercheAuthorizer } from './application/authorizers/recherche-authorizer'
import { RendezVousAuthorizer } from './application/authorizers/rendezvous-authorizer'
import { SuggestionAuthorizer } from './application/authorizers/suggestion-authorizer'
import { SupportAuthorizer } from './application/authorizers/support-authorizer'
import { AddCommentaireActionCommandHandler } from './application/commands/action/add-commentaire-action.command.handler'
import { CreateActionCommandHandler } from './application/commands/action/create-action.command.handler'
import { DeleteActionCommandHandler } from './application/commands/action/delete-action.command.handler'
import { UpdateActionCommandHandler } from './application/commands/action/update-action.command.handler'
import { AddFavoriOffreEmploiCommandHandler } from './application/commands/add-favori-offre-emploi.command.handler'
import { AddFavoriOffreImmersionCommandHandler } from './application/commands/add-favori-offre-immersion.command.handler'
import { AddFavoriOffreServiceCiviqueCommandHandler } from './application/commands/add-favori-offre-service-civique.command.handler'
import { ArchiverJeuneCommandHandler } from './application/commands/archiver-jeune.command.handler'
import { CreateCampagneCommandHandler } from './application/commands/campagne/create-campagne.command.handler'
import { CreateEvaluationCommandHandler } from './application/commands/campagne/create-evaluation.command.handler'
import { CloturerAnimationCollectiveCommandHandler } from './application/commands/cloturer-animation-collective.command.handler'
import { DeleteConseillerCommandHandler } from './application/commands/conseiller/delete-conseiller.command.handler'
import { ModifierConseillerCommandHandler } from './application/commands/conseiller/modifier-conseiller.command.handler'
import { CreateEvenementCommandHandler } from './application/commands/create-evenement.command.handler'
import { CreateListeDeDiffusionCommandHandler } from './application/commands/create-liste-de-diffusion.command.handler'
import { CreateRechercheFromSuggestionCommandHandler } from './application/commands/create-recherche-from-suggestion.command.handler'
import { CreateRechercheCommandHandler } from './application/commands/create-recherche.command.handler'
import { CreateRendezVousCommandHandler } from './application/commands/create-rendez-vous.command.handler'
import { CreateSuggestionConseillerImmersionCommandHandler } from './application/commands/create-suggestion-conseiller-immersion.command.handler'
import { CreateSuggestionConseillerOffreEmploiCommandHandler } from './application/commands/create-suggestion-conseiller-offre-emploi.command.handler'
import { CreateSuggestionConseillerServiceCiviqueCommandHandler } from './application/commands/create-suggestion-conseiller-service-civique.command.handler'
import { DeleteFavoriOffreEmploiCommandHandler } from './application/commands/delete-favori-offre-emploi.command.handler'
import { DeleteFavoriOffreImmersionCommandHandler } from './application/commands/delete-favori-offre-immersion.command.handler'
import { DeleteFavoriOffreServiceCiviqueCommandHandler } from './application/commands/delete-favori-offre-service-civique.command.handler'
import { DeleteJeuneInactifCommandHandler } from './application/commands/delete-jeune-inactif.command.handler'
import { DeleteJeuneCommandHandler } from './application/commands/delete-jeune.command.handler'
import { DeleteListeDeDiffusionCommandHandler } from './application/commands/delete-liste-de-diffusion.command.handler'
import { DeleteRechercheCommandHandler } from './application/commands/delete-recherche.command.handler'
import { DeleteRendezVousCommandHandler } from './application/commands/delete-rendez-vous.command.handler.db'
import { EnvoyerFormulaireContactImmersionCommandHandler } from './application/commands/envoyer-formulaire-contact-immersion.command.handler.db'
import { EnvoyerMessageGroupeCommandHandler } from './application/commands/envoyer-message-groupe.command.handler'
import { CreerJeuneMiloCommandHandler } from './application/commands/milo/creer-jeune-milo.command.handler'
import { QualifierActionCommandHandler } from './application/commands/milo/qualifier-action.command.handler'
import { QualifierActionsMiloCommandHandler } from './application/commands/milo/qualifier-actions-milo.command.handler'
import { UpdateSessionMiloCommandHandler } from './application/commands/milo/update-session-milo.command.handler'
import { ModifierJeuneDuConseillerCommandHandler } from './application/commands/modifier-jeune-du-conseiller.command.handler'
import { NotifierNouvellesImmersionsCommandHandler } from './application/commands/notifier-nouvelles-immersions.command.handler'
import { CreateDemarcheCommandHandler } from './application/commands/pole-emploi/create-demarche.command.handler'
import { CreerJeunePoleEmploiCommandHandler } from './application/commands/pole-emploi/creer-jeune-pole-emploi.command.handler'
import { UpdateStatutDemarcheCommandHandler } from './application/commands/pole-emploi/update-demarche.command.handler'
import { RafraichirSuggestionsCommandHandler } from './application/commands/rafraichir-suggestions.command.handler'
import { RecupererJeunesDuConseillerCommandHandler } from './application/commands/recuperer-jeunes-du-conseiller.command.handler'
import { RefuserSuggestionCommandHandler } from './application/commands/refuser-suggestion.command.handler'
import { SendNotificationsNouveauxMessagesExternesCommandHandler } from './application/commands/send-notifications-nouveaux-messages-externes.command.handler'
import { SendNotificationsNouveauxMessagesCommandHandler } from './application/commands/send-notifications-nouveaux-messages.command.handler'
import { ArchiverJeuneSupportCommandHandler } from './application/commands/support/archiver-jeune-support.command.handler'
import { CreerSuperviseursCommandHandler } from './application/commands/support/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from './application/commands/support/delete-superviseurs.command.handler'
import { MettreAJourLesJeunesCejPeCommandHandler } from './application/commands/support/mettre-a-jour-les-jeunes-cej-pe.command.handler'
import { RefreshJddCommandHandler } from './application/commands/support/refresh-jdd.command.handler'
import { UpdateAgenceConseillerCommandHandler } from './application/commands/support/update-agence-conseiller.command.handler'
import { SupprimerFichierCommandHandler } from './application/commands/supprimer-fichier.command.handler'
import { TeleverserFichierCommandHandler } from './application/commands/televerser-fichier.command.handler'
import { TransfererJeunesConseillerCommandHandler } from './application/commands/transferer-jeunes-conseiller.command.handler'
import { UpdateJeuneConfigurationApplicationCommandHandler } from './application/commands/update-jeune-configuration-application.command.handler'
import { UpdateJeuneCommandHandler } from './application/commands/update-jeune.command.handler'
import { UpdateListeDeDiffusionCommandHandler } from './application/commands/update-liste-de-diffusion.command.handler'
import { UpdateJeunePreferencesCommandHandler } from './application/commands/update-preferences-jeune.command.handler'
import { UpdateRendezVousCommandHandler } from './application/commands/update-rendez-vous.command.handler'
import { UpdateUtilisateurCommandHandler } from './application/commands/update-utilisateur.command.handler'
import { DumpForAnalyticsJobHandler } from './application/jobs/analytics/0-dump-for-analytics.job'
import { ChargerEvenementsJobHandler } from './application/jobs/analytics/1-charger-les-evenements.job'
import { NettoyerEvenementsChargesAnalyticsJobHandler } from './application/jobs/analytics/1bis-nettoyer-les-evenements-charges.job.handler.db'
import { EnrichirEvenementsJobHandler } from './application/jobs/analytics/2-enrichir-les-evenements.job'
import { ChargerLesVuesJobHandler } from './application/jobs/analytics/3-charger-les-vues.job'
import { CreerTablesAEAnnuellesJobHandler } from './application/jobs/analytics/creer-tables-ae-annuelles'
import { InitialiserLesVuesJobHandler } from './application/jobs/analytics/initialiser-les-vues.job'
import { EnvoyerEmailsMessagesConseillersJobHandler } from './application/jobs/envoyer-emails-messages-conseillers.job.handler'
import { FakeJobHandler } from './application/jobs/fake.job.handler'
import { HandleJobGenererJDDCommandHandler } from './application/jobs/generer-jdd.job.handler'
import { MajCodesEvenementsJobHandler } from './application/jobs/maj-codes-evenements.job.handler'
import { MajMailingListConseillerJobHandler } from './application/jobs/maj-mailing-list-conseiller.job.handler'
import { MajSegmentsJobHandler } from './application/jobs/maj-segments.job.handler.db'
import { MonitorJobsJobHandler } from './application/jobs/monitor-jobs.job.handler.db'
import { NettoyerLesDonneesJobHandler } from './application/jobs/nettoyer-les-donnees.job.handler.db'
import { NettoyerLesJobsJobHandler } from './application/jobs/nettoyer-les-jobs.job.handler'
import { NettoyerPiecesJointesJobHandler } from './application/jobs/nettoyer-pieces-jointes.job.handler'
import { NotifierRappelActionJobHandler } from './application/jobs/notifier-rappel-action.job.handler'
import { NotifierRappelCreationActionsDemarchesJobHandler } from './application/jobs/notifier-rappel-creation-actions-demarches.job.handler.db'
import { NotifierRappelInstanceSessionMiloJobHandler } from './application/jobs/notifier-rappel-instance-session-milo.job.handler'
import { NotifierRappelRendezVousJobHandler } from './application/jobs/notifier-rappel-rendez-vous.job.handler'
import { NotifierRecherchesOffreEmploiJobHandler } from './application/jobs/notifier-recherches-offre-emploi.job.handler'
import { NotifierRecherchesServiceCiviqueJobHandler } from './application/jobs/notifier-recherches-service-civique.job.handler'
import { NotifierRendezVousPEJobHandler } from './application/jobs/notifier-rendez-vous-pole-emploi.job.handler'
import { QualifierActionsJobHandler } from './application/jobs/qualifier-actions.job.handler.db'
import { RecupererAnalyseAntivirusJobHandler } from './application/jobs/recuperer-analyse-antivirus.job.handler'
import { RecupererSituationsJeunesMiloJobHandler } from './application/jobs/recuperer-situations-jeunes-milo.job.handler'
import { SuivreEvenementsMiloCronJobHandler } from './application/jobs/suivre-file-evenements-milo.job.handler'
import { TraiterEvenementMiloJobHandler } from './application/jobs/traiter-evenement-milo.job.handler'
import { GetActionsConseillerV2QueryHandler } from './application/queries/action/get-actions-conseiller-v2.query.handler.db'
import { GetActionsJeuneQueryHandler } from './application/queries/action/get-actions-jeune.query.handler.db'
import { GetActionsPredefiniesQueryHandler } from './application/queries/action/get-actions-predefinies.query.handler'
import { GetCommentairesActionQueryHandler } from './application/queries/action/get-commentaires-action.query.handler.db'
import { GetDetailActionQueryHandler } from './application/queries/action/get-detail-action.query.handler.db'
import { GetTypesQualificationsQueryHandler } from './application/queries/action/get-types-qualifications.query.handler'
import { GetFavorisJeuneQueryHandler } from './application/queries/favoris/get-favoris-jeune.query.handler.db'
import { GetMetadonneesFavorisJeuneQueryHandler } from './application/queries/favoris/get-metadonnees-favoris-jeune.query.handler.db'
import { GetAgencesQueryHandler } from './application/queries/get-agences.query.handler.db'
import { GetCatalogueDemarchesQueryHandler } from './application/queries/get-catalogue-demarches.query.handler'
import { GetChatSecretsQueryHandler } from './application/queries/get-chat-secrets.query.handler'
import { GetCommunesEtDepartementsQueryHandler } from './application/queries/get-communes-et-departements.query.handler.db'
import { GetConseillersJeuneQueryHandler } from './application/queries/get-conseillers-jeune.query.handler.db'
import { GetConseillersQueryHandler } from './application/queries/get-conseillers.query.handler.db'
import { GetCVPoleEmploiQueryHandler } from './application/queries/get-cv-pole-emploi.query.handler'
import { GetDemarchesConseillerQueryHandler } from './application/queries/get-demarches-conseiller.query.handler'
import { GetDemarchesQueryHandler } from './application/queries/get-demarches.query.handler'
import { GetDetailConseillerQueryHandler } from './application/queries/get-detail-conseiller.query.handler.db'
import { GetDetailJeuneQueryHandler } from './application/queries/get-detail-jeune.query.handler.db'
import { GetDetailListeDeDiffusionQueryHandler } from './application/queries/get-detail-liste-de-diffusion.query.handler.db'
import { GetDetailOffreEmploiQueryHandler } from './application/queries/get-detail-offre-emploi.query.handler'
import { GetDetailOffreImmersionQueryHandler } from './application/queries/get-detail-offre-immersion.query.handler'
import { GetDetailOffreServiceCiviqueQueryHandler } from './application/queries/get-detail-offre-service-civique.query.handler'
import { GetDiagorienteMetiersFavorisQueryHandler } from './application/queries/get-diagoriente-metiers-favoris.query.handler'
import { GetDiagorienteUrlsQueryHandler } from './application/queries/get-diagoriente-urls.query.handler'
import { GetDossierMiloJeuneQueryHandler } from './application/queries/get-dossier-milo-jeune.query.handler'
import { GetEvenementEmploiQueryHandler } from './application/queries/get-evenement-emploi.query.handler'
import { GetEvenementsEmploiQueryHandler } from './application/queries/get-evenements-emploi.query.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from './application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { GetFavorisOffresImmersionJeuneQueryHandler } from './application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import { GetFavorisServiceCiviqueJeuneQueryHandler } from './application/queries/get-favoris-service-civique-jeune.query.handler.db'
import { GetIndicateursPourConseillerQueryHandler } from './application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { GetJeuneHomeActionsQueryHandler } from './application/queries/get-jeune-home-actions.query.handler'
import { GetJeuneHomeAgendaQueryHandler } from './application/queries/get-jeune-home-agenda.query.handler.db'
import { GetJeuneHomeDemarchesQueryHandler } from './application/queries/get-jeune-home-demarches.query.handler'
import { GetJeuneMiloByDossierQueryHandler } from './application/queries/get-jeune-milo-by-dossier.query.handler.db'
import { GetJeunesByConseillerQueryHandler } from './application/queries/get-jeunes-by-conseiller.query.handler.db'
import { GetJeunesByEtablissementQueryHandler } from './application/queries/get-jeunes-by-etablissement.query.handler.db'
import { GetJeunesEtablissementV2QueryHandler } from './application/queries/get-jeunes-etablissement-v2.query.handler.db'
import { GetJeunesIdentitesQueryHandler } from './application/queries/get-jeunes-identites.query.handler.db'
import { GetListesDeDiffusionDuConseillerQueryHandler } from './application/queries/get-listes-de-diffusion-du-conseiller.query.handler.db'
import { GetMetiersRomeQueryHandler } from './application/queries/get-metiers-rome.query.handler.db'
import { GetMotifsSuppressionJeuneQueryHandler } from './application/queries/get-motifs-suppression-jeune.query.handler'
import { GetOffresEmploiQueryHandler } from './application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQueryHandler } from './application/queries/get-offres-immersion.query.handler'
import { GetOffresServicesCiviqueQueryHandler } from './application/queries/get-offres-services-civique.query.handler'
import { GetPreferencesJeuneQueryHandler } from './application/queries/get-preferences-jeune.query.handler.db'
import { GetRecherchesQueryHandler } from './application/queries/get-recherches.query.handler.db'
import { GetSuggestionsQueryHandler } from './application/queries/get-suggestions.query.handler.db'
import { GetSuiviSemainePoleEmploiQueryHandler } from './application/queries/get-suivi-semaine-pole-emploi.query.handler'
import { GetUtilisateurQueryHandler } from './application/queries/get-utilisateur.query.handler'
import { GetAccueilJeuneMiloQueryHandler } from './application/queries/milo/get-accueil-jeune-milo.query.handler.db'
import { GetJeunesByStructureMiloQueryHandler } from './application/queries/milo/get-jeunes-by-structure-milo.query.handler.db'
import { GetMonSuiviMiloQueryHandler } from './application/queries/milo/get-mon-suivi-jeune.milo.query.handler.db'
import { GetAccueilJeunePoleEmploiQueryHandler } from './application/queries/pole-emploi/get-accueil-jeune-pole-emploi.query.handler.db'
import { GetFavorisAccueilQueryGetter } from './application/queries/query-getters/accueil/get-favoris.query.getter.db'
import { GetRecherchesSauvegardeesQueryGetter } from './application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { FindAllOffresEmploiQueryGetter } from './application/queries/query-getters/find-all-offres-emploi.query.getter'
import { FindAllOffresImmersionQueryGetter } from './application/queries/query-getters/find-all-offres-immersion.query.getter.db'
import { FindAllOffresServicesCiviqueQueryGetter } from './application/queries/query-getters/find-all-offres-services-civique.query.getter'
import { GetCampagneQueryGetter } from './application/queries/query-getters/get-campagne.query.getter'
import { GetSessionsConseillerMiloQueryGetter } from './application/queries/query-getters/milo/get-sessions-conseiller.milo.query.getter.db'
import { GetDemarchesQueryGetter } from './application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from './application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { RechercherTypesDemarcheQueryHandler } from './application/queries/rechercher-types-demarche.query.handler'
import { GetAnimationsCollectivesJeuneQueryHandler } from './application/queries/rendez-vous/get-animations-collectives-jeune.query.handler.db'
import { GetAnimationsCollectivesV2QueryHandler } from './application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'
import { GetAnimationsCollectivesQueryHandler } from './application/queries/rendez-vous/get-animations-collectives.query.handler.db'
import { GetDetailRendezVousJeuneQueryHandler } from './application/queries/rendez-vous/get-detail-rendez-vous-jeune.query.handler.db'
import { GetDetailRendezVousQueryHandler } from './application/queries/rendez-vous/get-detail-rendez-vous.query.handler.db'
import { GetRendezVousConseillerPaginesQueryHandler } from './application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from './application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { GetRendezVousJeuneQueryHandler } from './application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import { GetTypesRendezVousQueryHandler } from './application/queries/rendez-vous/get-types-rendez-vous.query.handler'
import { TelechargerFichierQueryHandler } from './application/queries/telecharger-fichier.query.handler'
import { TaskService } from './application/task.service'
import { InitCronsCommandHandler } from './application/tasks/init-crons.command'
import { PlanifierExecutionCronCommandHandler } from './application/tasks/planifier-execution-cron.command.handler'
import { SynchronizeJobsCommandHandler } from './application/tasks/synchronize-jobs.command'
import { WorkerService } from './application/worker.service.db'
import { Context } from './building-blocks/context'
import configuration from './config/configuration'
import {
  Action,
  ActionRepositoryToken,
  CommentaireActionRepositoryToken
} from './domain/action/action'
import { AgenceRepositoryToken } from './domain/agence'
import { ArchiveJeuneRepositoryToken } from './domain/archive-jeune'
import {
  Authentification,
  AuthentificationRepositoryToken
} from './domain/authentification'
import { Campagne, CampagneRepositoryToken } from './domain/campagne'
import { ChatRepositoryToken } from './domain/chat'
import { Demarche, DemarcheRepositoryToken } from './domain/demarche'
import { EvenementService, EvenementsRepositoryToken } from './domain/evenement'
import { Fichier, FichierRepositoryToken } from './domain/fichier'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken,
  JeunePoleEmploiRepositoryToken,
  JeuneRepositoryToken
} from './domain/jeune/jeune'
import { Mail, MailRepositoryToken, MailServiceToken } from './domain/mail'
import { ActionMiloRepositoryToken } from './domain/milo/action.milo'
import { Conseiller, ConseillerRepositoryToken } from './domain/milo/conseiller'
import { ConseillerMiloRepositoryToken } from './domain/milo/conseiller.milo.db'
import { EvenementMiloRepositoryToken } from './domain/milo/evenement.milo'
import { JeuneMiloRepositoryToken } from './domain/milo/jeune.milo'
import { ListeDeDiffusionRepositoryToken } from './domain/milo/liste-de-diffusion'
import {
  RendezVousMilo,
  RendezVousMiloRepositoryToken
} from './domain/milo/rendez-vous.milo'
import { SessionMiloRepositoryToken } from './domain/milo/session.milo'
import {
  Notification,
  NotificationRepositoryToken
} from './domain/notification/notification'
import { OffresEmploiRepositoryToken } from './domain/offre/favori/offre-emploi'
import { FavorisOffresImmersionRepositoryToken } from './domain/offre/favori/offre-immersion'
import { OffreServiceCiviqueRepositoryToken } from './domain/offre/favori/offre-service-civique'
import {
  Recherche,
  RecherchesRepositoryToken
} from './domain/offre/recherche/recherche'
import { SuggestionPoleEmploiService } from './domain/offre/recherche/suggestion/pole-emploi.service'
import {
  Suggestion,
  SuggestionsPoleEmploiRepositoryToken,
  SuggestionsRepositoryToken
} from './domain/offre/recherche/suggestion/suggestion'
import {
  PlanificateurRepositoryToken,
  PlanificateurService
} from './domain/planificateur'
import { AnimationCollectiveRepositoryToken } from './domain/rendez-vous/animation-collective'
import { HistoriqueRendezVousRepositoryToken } from './domain/rendez-vous/historique'
import {
  RendezVous,
  RendezVousRepositoryToken
} from './domain/rendez-vous/rendez-vous'
import { SuiviJobServiceToken } from './domain/suivi-job'
import { SuperviseursRepositoryToken } from './domain/superviseur'
import { ApiKeyAuthGuard } from './infrastructure/auth/api-key.auth-guard'
import { JwtService } from './infrastructure/auth/jwt.service'
import { OidcAuthGuard } from './infrastructure/auth/oidc.auth-guard'
import { BigqueryClient } from './infrastructure/clients/bigquery.client'
import { DiagorienteClient } from './infrastructure/clients/diagoriente-client'
import { EngagementClient } from './infrastructure/clients/engagement-client'
import { FirebaseClient } from './infrastructure/clients/firebase-client'
import { ImmersionClient } from './infrastructure/clients/immersion-client'
import { InvitationIcsClient } from './infrastructure/clients/invitation-ics.client'
import { KeycloakClient } from './infrastructure/clients/keycloak-client.db'
import { MailBrevoService } from './infrastructure/clients/mail-brevo.service.db'
import { MatomoClient } from './infrastructure/clients/matomo-client'
import { MiloClient } from './infrastructure/clients/milo-client'
import { ObjectStorageClient } from './infrastructure/clients/object-storage.client'
import { PoleEmploiClient } from './infrastructure/clients/pole-emploi-client'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken,
  PoleEmploiPartenaireInMemoryClient
} from './infrastructure/clients/pole-emploi-partenaire-client.db'
import { SuiviJobService } from './infrastructure/clients/suivi-job.service.db'
import { ActionSqlRepository } from './infrastructure/repositories/action/action-sql.repository.db'
import { CommentaireActionSqlRepositoryDb } from './infrastructure/repositories/action/commentaire-action-sql.repository.db'
import { AgenceSqlRepository } from './infrastructure/repositories/agence-sql.repository.db'
import { ArchiveJeuneSqlRepository } from './infrastructure/repositories/archive-jeune-sql.repository.db'
import { AuthentificationSqlKeycloakRepository } from './infrastructure/repositories/authentification-sql.repository.db'
import { CampagneSqlRepository } from './infrastructure/repositories/campagne-sql.repository.db'
import { ChatFirebaseRepository } from './infrastructure/repositories/chat-firebase.repository'
import { ConseillerSqlRepository } from './infrastructure/repositories/conseiller-sql.repository.db'
import { ListeDeDiffusionSqlRepository } from './infrastructure/repositories/conseiller/liste-de-diffusion-sql.repository.db'
import { DemarcheHttpRepository } from './infrastructure/repositories/demarche-http.repository'
import { EvenementSqlRepository } from './infrastructure/repositories/evenement-sql.repository.db'
import { FichierSqlS3Repository } from './infrastructure/repositories/fichier-sql-s3.repository.db'
import { JeuneConfigurationApplicationSqlRepository } from './infrastructure/repositories/jeune/jeune-configuration-application-sql.repository.db'
import { JeunePoleEmploiSqlRepository } from './infrastructure/repositories/jeune/jeune-pole-emploi-sql.repository.db'
import { JeuneSqlRepository } from './infrastructure/repositories/jeune/jeune-sql.repository.db'
import { MailSqlRepository } from './infrastructure/repositories/mail-sql.repository.db'
import { ActionMiloHttpRepository } from './infrastructure/repositories/milo/action.milo.repository'
import { ConseillerMiloSqlRepository } from './infrastructure/repositories/milo/conseiller.milo.repository.db'
import { EvenementMiloHttpRepository } from './infrastructure/repositories/milo/evenement-milo-http.repository'
import { MiloJeuneHttpSqlRepository } from './infrastructure/repositories/milo/jeune-milo-http-sql.repository.db'
import { RendezVousMiloHttpRepository } from './infrastructure/repositories/milo/rendez-vous-milo-http.repository'
import { SessionMiloHttpSqlRepository } from './infrastructure/repositories/milo/session-milo-http-sql.repository.db'
import { NotificationFirebaseSqlRepository } from './infrastructure/repositories/notification-firebase.repository'
import { OffresEmploiHttpSqlRepository } from './infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { FavorisOffresImmersionSqlRepository } from './infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { OffreServiceCiviqueHttpSqlRepository } from './infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { RechercheSqlRepository } from './infrastructure/repositories/offre/recherche/recherche-sql.repository.db'
import { SuggestionPeHttpRepository } from './infrastructure/repositories/offre/recherche/suggestion/suggestion-pe-http.repository.db'
import { SuggestionSqlRepository } from './infrastructure/repositories/offre/recherche/suggestion/suggestion-sql.repository.db'
import { PlanificateurRedisRepository } from './infrastructure/repositories/planificateur-redis.repository.db'
import { AnimationCollectiveSqlRepository } from './infrastructure/repositories/rendez-vous/animation-collective-sql.repository.db'
import { HistoriqueRendezVousRepositorySql } from './infrastructure/repositories/rendez-vous/historique-rendez-vous.repository.db'
import { RendezVousRepositorySql } from './infrastructure/repositories/rendez-vous/rendez-vous-sql.repository.db'
import { SuperviseurSqlRepository } from './infrastructure/repositories/superviseur-sql.repository.db'
import { ActionsController } from './infrastructure/routes/actions.controller'
import { AuthentificationController } from './infrastructure/routes/authentification.controller'
import { CampagnesController } from './infrastructure/routes/campagnes.controller'
import { ConseillersController } from './infrastructure/routes/conseillers.controller'
import { ConseillersMiloController } from './infrastructure/routes/conseillers.milo.controller'
import { ConseillersPoleEmploiController } from './infrastructure/routes/conseillers.pole-emploi.controller'
import { DiagorienteController } from './infrastructure/routes/diagoriente.controller'
import { EtablissementsController } from './infrastructure/routes/etablissements.controller'
import { EvenementsEmploiController } from './infrastructure/routes/evenements-emploi.controller'
import { EvenementsController } from './infrastructure/routes/evenements.controller'
import { FavorisController } from './infrastructure/routes/favoris.controller'
import { FilesController } from './infrastructure/routes/fichiers.controller'
import { HealthController } from './infrastructure/routes/health.controller'
import { JeunesController } from './infrastructure/routes/jeunes.controller'
import { JeunesMiloController } from './infrastructure/routes/jeunes.milo.controller'
import { JeunesPoleEmploiController } from './infrastructure/routes/jeunes.pole-emploi.controller'
import { ListesDeDiffusionController } from './infrastructure/routes/listes-de-diffusion.controller'
import { MessagesController } from './infrastructure/routes/messages.controller'
import { OffresEmploiController } from './infrastructure/routes/offres-emploi.controller'
import { OffresImmersionController } from './infrastructure/routes/offres-immersion.controller'
import { RecherchesConseillersController } from './infrastructure/routes/recherches-conseillers.controller'
import { RecherchesJeunesController } from './infrastructure/routes/recherches-jeunes.controller'
import { ReferentielsController } from './infrastructure/routes/referentiels.controller'
import { RendezVousController } from './infrastructure/routes/rendez-vous.controller'
import { ServicesCiviqueController } from './infrastructure/routes/services-civique.controller'
import { StructuresMiloController } from './infrastructure/routes/structures.milo.controller'
import { SupportController } from './infrastructure/routes/support.controller'
import { databaseProviders } from './infrastructure/sequelize/providers'
import { ChatCryptoService } from './utils/chat-crypto-service'
import { DateService } from './utils/date-service'
import { IdService } from './utils/id-service'
import { configureLoggerModule } from './utils/logger.module'
import { RateLimiterService } from './utils/rate-limiter.service'
import { CJEController } from './infrastructure/routes/cje.controller'
import { GetCJETokenQueryHandler } from './application/queries/get-cje-token.query.handler'
import { NotifierBonneAlternanceJobHandler } from './application/jobs/notifier-bonne-alternance.job.handler.db'
import { NotifierCampagneJobHandler } from './application/jobs/notifier-campagne.job.handler.db'
import { GetNotificationsJeuneQueryHandler } from './application/queries/get-notifications-jeune.query.handler.db'

export const buildModuleMetadata = (): ModuleMetadata => ({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      cache: true,
      load: [configuration]
    }),
    configureLoggerModule(),
    HttpModule.register({
      timeout: 6000
    }),
    TerminusModule
  ],
  controllers: [
    // De base
    JeunesController,
    JeunesMiloController,
    JeunesPoleEmploiController,
    ConseillersController,
    ConseillersMiloController,
    ConseillersPoleEmploiController,
    ActionsController,
    RendezVousController,
    EtablissementsController,
    StructuresMiloController,
    // Recherche
    OffresEmploiController,
    OffresImmersionController,
    ServicesCiviqueController,
    FavorisController,
    RecherchesJeunesController,
    RecherchesConseillersController,
    DiagorienteController,
    EvenementsEmploiController,
    // Evenements d'engagement
    EvenementsController,
    // Messages
    MessagesController,
    ListesDeDiffusionController,
    FilesController,
    // Referentiels
    ReferentielsController,
    // Campagnes
    CampagnesController,
    // Autre
    CJEController,
    AuthentificationController,
    SupportController,
    HealthController
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
    MiloClient,
    ImmersionClient,
    EngagementClient,
    MatomoClient,
    ObjectStorageClient,
    AntivirusClient,
    Action.Factory,
    Action.Commentaire.Factory,
    Conseiller.Milo.Service,
    Mail.Factory,
    Authentification.Factory,
    Campagne.Factory,
    Demarche.Factory,
    RendezVous.Historique.Factory,
    RendezVous.Factory,
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
    DiagorienteClient,
    {
      provide: APP_GUARD,
      useClass: OidcAuthGuard
    },
    {
      provide: ActionRepositoryToken,
      useClass: ActionSqlRepository
    },
    {
      provide: JeuneRepositoryToken,
      useClass: JeuneSqlRepository
    },
    {
      provide: ConseillerRepositoryToken,
      useClass: ConseillerSqlRepository
    },
    {
      provide: ConseillerMiloRepositoryToken,
      useClass: ConseillerMiloSqlRepository
    },
    {
      provide: SessionMiloRepositoryToken,
      useClass: SessionMiloHttpSqlRepository
    },
    {
      provide: OffresEmploiRepositoryToken,
      useClass: OffresEmploiHttpSqlRepository
    },
    {
      provide: NotificationRepositoryToken,
      useClass: NotificationFirebaseSqlRepository
    },
    {
      provide: ChatRepositoryToken,
      useClass: ChatFirebaseRepository
    },
    {
      provide: MailServiceToken,
      useClass: MailBrevoService
    },
    {
      provide: RendezVousRepositoryToken,
      useClass: RendezVousRepositorySql
    },
    {
      provide: AuthentificationRepositoryToken,
      useClass: AuthentificationSqlKeycloakRepository
    },
    {
      provide: JeuneMiloRepositoryToken,
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
      provide: RendezVousMiloRepositoryToken,
      useClass: RendezVousMiloHttpRepository
    },
    {
      provide: EvenementMiloRepositoryToken,
      useClass: EvenementMiloHttpRepository
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
    RechercherMessageQueryHandler,
    JeuneAuthorizer,
    RechercheAuthorizer,
    RendezVousAuthorizer,
    SupportAuthorizer,
    SuggestionAuthorizer,
    FavoriOffreServiceCiviqueAuthorizer,
    ConseillerInterAgenceAuthorizer,
    ConseillerInterStructureMiloAuthorizer,
    ListeDeDiffusionAuthorizer,
    GetDetailActionQueryHandler,
    GetDetailJeuneQueryHandler,
    GetJeunesByEtablissementQueryHandler,
    GetUtilisateurQueryHandler,
    UpdateJeuneCommandHandler,
    GetJeunesEtablissementV2QueryHandler,
    GetJeunesByStructureMiloQueryHandler,
    GetActionsJeuneQueryHandler,
    CreateActionCommandHandler,
    CreerJeunePoleEmploiCommandHandler,
    AddFavoriOffreEmploiCommandHandler,
    AddFavoriOffreImmersionCommandHandler,
    DeleteFavoriOffreEmploiCommandHandler,
    DeleteFavoriOffreImmersionCommandHandler,
    GetFavorisOffresEmploiJeuneQueryHandler,
    GetFavorisOffresImmersionJeuneQueryHandler,
    GetOffresEmploiQueryHandler,
    GetOffresImmersionQueryHandler,
    GetDetailOffreImmersionQueryHandler,
    GetDetailOffreEmploiQueryHandler,
    GetDetailConseillerQueryHandler,
    GetJeunesByConseillerQueryHandler,
    UpdateJeuneConfigurationApplicationCommandHandler,
    UpdateActionCommandHandler,
    CreateRendezVousCommandHandler,
    DeleteRendezVousCommandHandler,
    GetRendezVousJeuneQueryHandler,
    GetRendezVousJeunePoleEmploiQueryHandler,
    SendNotificationsNouveauxMessagesCommandHandler,
    SendNotificationsNouveauxMessagesExternesCommandHandler,
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
    GetConseillersQueryHandler,
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
    GetCampagneQueryGetter,
    CreateEvaluationCommandHandler,
    UpdateStatutDemarcheCommandHandler,
    CreateDemarcheCommandHandler,
    RechercherTypesDemarcheQueryHandler,
    TeleverserFichierCommandHandler,
    QualifierActionsMiloCommandHandler,
    TelechargerFichierQueryHandler,
    SupprimerFichierCommandHandler,
    FichierAuthorizer,
    FindAllOffresEmploiQueryGetter,
    FindAllOffresImmersionQueryGetter,
    FindAllOffresServicesCiviqueQueryGetter,
    RecupererJeunesDuConseillerCommandHandler,
    ArchiverJeuneCommandHandler,
    GetMotifsSuppressionJeuneQueryHandler,
    PlanifierExecutionCronCommandHandler,
    UpdateJeunePreferencesCommandHandler,
    GetPreferencesJeuneQueryHandler,
    GetMetadonneesFavorisJeuneQueryHandler,
    ModifierJeuneDuConseillerCommandHandler,
    GetFavorisJeuneQueryHandler,
    AddCommentaireActionCommandHandler,
    GetCommentairesActionQueryHandler,
    GetJeuneHomeAgendaQueryHandler,
    GetRendezVousConseillerPaginesQueryHandler,
    GetTypesQualificationsQueryHandler,
    QualifierActionCommandHandler,
    GetSuiviSemainePoleEmploiQueryHandler,
    GetDemarchesQueryGetter,
    GetRecherchesSauvegardeesQueryGetter,
    GetRendezVousJeunePoleEmploiQueryGetter,
    GetIndicateursPourConseillerQueryHandler,
    RafraichirSuggestionsCommandHandler,
    GetSuggestionsQueryHandler,
    RefuserSuggestionCommandHandler,
    CreateRechercheFromSuggestionCommandHandler,
    GetMetiersRomeQueryHandler,
    CreateSuggestionConseillerOffreEmploiCommandHandler,
    CreateSuggestionConseillerServiceCiviqueCommandHandler,
    CreateSuggestionConseillerImmersionCommandHandler,
    EnvoyerFormulaireContactImmersionCommandHandler,
    GetActionsPredefiniesQueryHandler,
    GetAnimationsCollectivesQueryHandler,
    GetAnimationsCollectivesV2QueryHandler,
    GetAccueilJeuneMiloQueryHandler,
    GetAccueilJeunePoleEmploiQueryHandler,
    CloturerAnimationCollectiveCommandHandler,
    GetAnimationsCollectivesJeuneQueryHandler,
    GetDetailRendezVousJeuneQueryHandler,
    CreateListeDeDiffusionCommandHandler,
    GetListesDeDiffusionDuConseillerQueryHandler,
    UpdateListeDeDiffusionCommandHandler,
    DeleteListeDeDiffusionCommandHandler,
    GetDetailListeDeDiffusionQueryHandler,
    RefreshJddCommandHandler,
    EnvoyerMessageGroupeCommandHandler,
    MettreAJourLesJeunesCejPeCommandHandler,
    UpdateAgenceConseillerCommandHandler,
    GetActionsConseillerV2QueryHandler,
    GetDiagorienteUrlsQueryHandler,
    GetCJETokenQueryHandler,
    ArchiverJeuneSupportCommandHandler,
    GetDiagorienteMetiersFavorisQueryHandler,
    GetJeunesIdentitesQueryHandler,
    DeleteConseillerCommandHandler,
    GetFavorisAccueilQueryGetter,
    GetCVPoleEmploiQueryHandler,
    GetEvenementsEmploiQueryHandler,
    GetEvenementEmploiQueryHandler,
    GetSessionsConseillerMiloQueryHandler,
    GetSessionsConseillerMiloQueryGetter,
    GetAgendaSessionsConseillerMiloQueryHandler,
    GetSessionsJeuneMiloQueryHandler,
    GetSessionsJeuneMiloQueryGetter,
    GetDetailSessionConseillerMiloQueryHandler,
    GetDetailSessionJeuneMiloQueryHandler,
    UpdateSessionMiloCommandHandler,
    EmargerSessionMiloCommandHandler,
    EvenementEmploiCodePostalQueryGetter,
    GetCatalogueDemarchesQueryHandler,
    GetMonSuiviMiloQueryHandler,
    GetTokenPoleEmploiQueryHandler,
    GetMonSuiviPoleEmploiQueryHandler,
    GetCompteursBeneficiaireMiloQueryHandler,
    GetDemarchesConseillerQueryHandler,
    GetNotificationsJeuneQueryHandler
  ]
}

export function buildJobHandlerProviders(): Provider[] {
  return JobHandlerProviders
}

export const JobHandlerProviders = [
  NettoyerLesJobsJobHandler,
  FakeJobHandler,
  NotifierRappelRendezVousJobHandler,
  NotifierRappelActionJobHandler,
  EnvoyerEmailsMessagesConseillersJobHandler,
  NotifierRecherchesOffreEmploiJobHandler,
  RecupererSituationsJeunesMiloJobHandler,
  MajCodesEvenementsJobHandler,
  NotifierRappelInstanceSessionMiloJobHandler,
  NotifierRendezVousPEJobHandler,
  NettoyerPiecesJointesJobHandler,
  MajMailingListConseillerJobHandler,
  NotifierRecherchesServiceCiviqueJobHandler,
  NettoyerLesDonneesJobHandler,
  MajSegmentsJobHandler,
  MonitorJobsJobHandler,
  HandleJobGenererJDDCommandHandler,
  SuivreEvenementsMiloCronJobHandler,
  TraiterEvenementMiloJobHandler,
  DumpForAnalyticsJobHandler,
  ChargerEvenementsJobHandler,
  NettoyerEvenementsChargesAnalyticsJobHandler,
  EnrichirEvenementsJobHandler,
  ChargerLesVuesJobHandler,
  InitialiserLesVuesJobHandler,
  CreerTablesAEAnnuellesJobHandler,
  QualifierActionsJobHandler,
  RecupererAnalyseAntivirusJobHandler,
  NotifierRappelCreationActionsDemarchesJobHandler,
  NotifierBonneAlternanceJobHandler,
  NotifierCampagneJobHandler
]

@Module(buildModuleMetadata())
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AppMobileCacheControlMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.GET })
  }
}
