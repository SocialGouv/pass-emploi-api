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
import { AddFavoriOffreServiceCiviqueCommandHandler } from './application/commands/add-favori-offre-service-civique-command-handler.service'
import { AddFavoriOffreImmersionCommandHandler } from './application/commands/add-favori-offre-immersion.command.handler'
import { CreateActionCommandHandler } from './application/commands/create-action.command.handler'
import { CreateEvenementCommandHandler } from './application/commands/create-evenement.command.handler'
import { CreateRechercheCommandHandler } from './application/commands/create-recherche.command.handler'
import { CreateRendezVousCommandHandler } from './application/commands/create-rendez-vous.command.handler'
import { CreerJeuneMiloCommandHandler } from './application/commands/creer-jeune-milo.command.handler'
import { CreerJeunePoleEmploiCommandHandler } from './application/commands/creer-jeune-pole-emploi.command.handler'
import { CreerSuperviseursCommandHandler } from './application/commands/creer-superviseurs.command.handler'
import { DeleteActionCommandHandler } from './application/commands/delete-action.command.handler'
import { DeleteFavoriOffreEmploiCommandHandler } from './application/commands/delete-favori-offre-emploi.command.handler'
import { DeleteFavoriOffreEngagementCommandHandler } from './application/commands/delete-favori-offre-engagement.command.handler'
import { DeleteFavoriOffreImmersionCommandHandler } from './application/commands/delete-favori-offre-immersion.command.handler'
import { DeleteJeuneInactifCommandHandler } from './application/commands/delete-jeune-inactif.command.handler'
import { DeleteRechercheCommandHandler } from './application/commands/delete-recherche.command.handler'
import { DeleteRendezVousCommandHandler } from './application/commands/delete-rendez-vous.command.handler'
import { DeleteSuperviseursCommandHandler } from './application/commands/delete-superviseurs.command.handler'
import { HandleJobMailConseillerCommandHandler } from './application/commands/jobs/handle-job-mail-conseiller.command'
import { HandleNettoyerLesJobsCommandHandler } from './application/commands/jobs/handle-job-nettoyer-les-jobs.command'
import { HandleJobRappelRendezVousCommandHandler } from './application/commands/jobs/handle-job-rappel-rendez-vous.command'
import { HandleJobUpdateMailingListConseillerCommandHandler } from './application/commands/jobs/handle-job-update-mailing-list-conseiller.command'
import { NotifierNouvellesImmersionsCommandHandler } from './application/commands/notifier-nouvelles-immersions.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from './application/commands/send-notification-nouveau-message.command.handler'
import { SendNotificationsNouveauxMessagesCommandHandler } from './application/commands/send-notifications-nouveaux-messages.command.handler'
import { InitCronsCommandHandler } from './application/commands/tasks/init-crons.command'
import { SynchronizeJobsCommandHandler } from './application/commands/tasks/synchronize-jobs.command'
import { TransfererJeunesConseillerCommandHandler } from './application/commands/transferer-jeunes-conseiller.command.handler'
import { UpdateNotificationTokenCommandHandler } from './application/commands/update-notification-token.command.handler'
import { UpdateStatutActionCommandHandler } from './application/commands/update-statut-action.command.handler'
import { UpdateUtilisateurCommandHandler } from './application/commands/update-utilisateur.command.handler'
import { TeleverserFichierCommandHandler } from './application/commands/televerser-fichier.command.handler'
import { GetActionsByJeuneQueryHandler } from './application/queries/get-actions-by-jeune.query.handler.db'
import { GetChatSecretsQueryHandler } from './application/queries/get-chat-secrets.query.handler'
import { GetCommunesEtDepartementsQueryHandler } from './application/queries/get-communes-et-departements.query.handler.db'
import { GetConseillerByEmailQueryHandler } from './application/queries/get-conseiller-by-email.query.handler.db'
import { GetConseillersJeuneQueryHandler } from './application/queries/get-conseillers-jeune.query.handler.db'
import { GetDetailActionQueryHandler } from './application/queries/get-detail-action.query.handler.db'
import { GetDetailConseillerQueryHandler } from './application/queries/get-detail-conseiller.query.handler.db'
import { GetDetailJeuneQueryHandler } from './application/queries/get-detail-jeune.query.handler.db'
import { GetDetailOffreEmploiQueryHandler } from './application/queries/get-detail-offre-emploi.query.handler.db'
import { GetDetailOffreImmersionQueryHandler } from './application/queries/get-detail-offre-immersion.query.handler'
import { GetDetailRendezVousQueryHandler } from './application/queries/get-detail-rendez-vous.query.handler.db'
import { GetDetailServiceCiviqueQueryHandler } from './application/queries/get-detail-service-civique.query.handler'
import { GetDossierMiloJeuneQueryHandler } from './application/queries/get-dossier-milo-jeune.query.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from './application/queries/get-favoris-offres-emploi-jeune.query.handler'
import { GetFavorisOffresImmersionJeuneQueryHandler } from './application/queries/get-favoris-offres-immersion-jeune.query.handler'
import { GetHomeJeuneHandler } from './application/queries/get-home-jeune.query.handler'
import { GetJeunesByConseillerQueryHandler } from './application/queries/get-jeunes-by-conseiller.query.handler.db'
import { GetOffresEmploiQueryHandler } from './application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQueryHandler } from './application/queries/get-offres-immersion.query.handler'
import { GetRecherchesQueryHandler } from './application/queries/get-recherches.query.handler'
import { GetAllRendezVousConseillerQueryHandler } from './application/queries/get-rendez-vous-conseiller.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from './application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import { GetRendezVousJeuneQueryHandler } from './application/queries/get-rendez-vous-jeune.query.handler.db'
import { GetResumeActionsDesJeunesDuConseillerQueryHandler } from './application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import { GetServicesCiviqueQueryHandler } from './application/queries/get-services-civique.query.handler'
import { GetTypesRendezVousQueryHandler } from './application/queries/get-types-rendez-vous.query.handler'
import { TaskService } from './application/task.service'
import { WorkerService } from './application/worker.service.db'
import configuration from './config/configuration'
import { Action, ActionsRepositoryToken } from './domain/action'
import {
  Authentification,
  AuthentificationRepositoryToken
} from './domain/authentification'
import { ChatRepositoryToken } from './domain/chat'
import { ConseillersRepositoryToken } from './domain/conseiller'
import { EvenementService, EvenementsRepositoryToken } from './domain/evenement'
import { Fichier, FichierRepositoryToken } from './domain/fichier'
import { JeunesRepositoryToken } from './domain/jeune'
import { MiloRepositoryToken } from './domain/milo'
import { NotificationRepositoryToken } from './domain/notification'
import { OffresEmploiRepositoryToken } from './domain/offre-emploi'
import { OffreServiceCiviqueRepositoryToken } from './domain/offre-service-civique'
import { OffresImmersionRepositoryToken } from './domain/offre-immersion'
import {
  PlanificateurRepositoryToken,
  PlanificateurService
} from './domain/planificateur'
import { RecherchesRepositoryToken } from './domain/recherche'
import { RendezVousRepositoryToken } from './domain/rendez-vous'
import { SuperviseursRepositoryToken } from './domain/superviseur'
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
import { ActionSqlRepository } from './infrastructure/repositories/action-sql.repository.db'
import { AuthentificationSqlRepository } from './infrastructure/repositories/authentification-sql.repository.db'
import { ChatFirebaseRepository } from './infrastructure/repositories/chat-firebase.repository'
import { ConseillerSqlRepository } from './infrastructure/repositories/conseiller-sql.repository.db'
import { EvenementHttpSqlRepository } from './infrastructure/repositories/evenement-http-sql.repository.db'
import { FichierSqlS3Repository } from './infrastructure/repositories/fichier-sql-s3.repository.db'
import { JeuneSqlRepository } from './infrastructure/repositories/jeune-sql.repository.db'
import { MailSqlRepository } from './infrastructure/repositories/mail-sql.repository.db'
import { MiloHttpSqlRepository } from './infrastructure/repositories/milo-http-sql.repository.db'
import { NotificationFirebaseRepository } from './infrastructure/repositories/notification-firebase.repository'
import { OffresEmploiHttpSqlRepository } from './infrastructure/repositories/offre-emploi-http-sql.repository.db'
import { OffreServiceCiviqueHttpSqlRepository } from './infrastructure/repositories/offre-service-civique-http.repository.db'
import { OffresImmersionHttpSqlRepository } from './infrastructure/repositories/offre-immersion-http-sql.repository.db'
import { PlanificateurRedisRepository } from './infrastructure/repositories/planificateur-redis.repository.db'
import { RechercheSqlRepository } from './infrastructure/repositories/recherche-sql.repository.db'
import { RendezVousRepositorySql } from './infrastructure/repositories/rendez-vous-sql.repository.db'
import { SuperviseurSqlRepository } from './infrastructure/repositories/superviseur-sql.repository.db'
import { ActionsController } from './infrastructure/routes/actions.controller'
import { AuthentificationController } from './infrastructure/routes/authentification.controller'
import { ConseillersController } from './infrastructure/routes/conseillers.controller'
import { EvenementsController } from './infrastructure/routes/evenements.controller'
import { FavorisController } from './infrastructure/routes/favoris.controller'
import { HealthController } from './infrastructure/routes/health.controller'
import { JeunesController } from './infrastructure/routes/jeunes.controller'
import { OffresEmploiController } from './infrastructure/routes/offres-emploi.controller'
import { OffresImmersionController } from './infrastructure/routes/offres-immersion.controller'
import { RecherchesController } from './infrastructure/routes/recherches.controller'
import { ReferentielsController } from './infrastructure/routes/referentiels.controller'
import { RendezVousController } from './infrastructure/routes/rendez-vous.controller'
import { ServicesCiviqueController } from './infrastructure/routes/services-civique.controller'
import { databaseProviders } from './infrastructure/sequelize/providers'
import { DateService } from './utils/date-service'
import { IdService } from './utils/id-service'
import { configureLoggerModule } from './utils/logger.module'
import { PoleEmploiPartenaireClient } from './infrastructure/clients/pole-emploi-partenaire-client'
import { GetActionsJeunePoleEmploiQueryHandler } from './application/queries/get-actions-jeune-pole-emploi.query.handler'
import { GetJeuneMiloByDossierQueryHandler } from './application/queries/get-jeune-milo-by-dossier.query.handler'
import { UpdateRendezVousCommandHandler } from './application/commands/update-rendez-vous.command.handler'
import { InvitationIcsClient } from './infrastructure/clients/invitation-ics.client'
import { Mail, MailRepositoryToken, MailServiceToken } from './domain/mail'
import { ChatCryptoService } from './utils/chat-crypto-service'
import { DeleteJeuneCommandHandler } from './application/commands/delete-jeune.command.handler'
import { AgenceRepositoryToken } from './domain/agence'
import { AgenceSqlRepository } from './infrastructure/repositories/agence-sql.repository.db'
import { GetAgencesQueryHandler } from './application/queries/get-agences.query.handler'
import { ModifierConseillerCommandHandler } from './application/commands/modifier-conseiller.command.handler'
import { HandleJobNotifierNouvellesOffresEmploiCommandHandler } from './application/commands/jobs/handle-job-notifier-nouvelles-offres-emploi.command'
import { HandleJobNotifierNouveauxServicesCiviqueCommandHandler } from './application/commands/jobs/handle-job-notification-recherche-service-civique.command.handler'
import { GetFavorisServiceCiviqueJeuneQueryHandler } from './application/queries/get-favoris-service-civique-jeune.query.handler'
import { HandleJobRecupererSituationsJeunesMiloCommandHandler } from './application/commands/jobs/handle-job-recuperer-situations-jeunes-milo.command'
import { CampagnesController } from './infrastructure/routes/campagnes.controller'
import { Campagne, CampagneRepositoryToken } from './domain/campagne'
import { CampagneSqlRepository } from './infrastructure/repositories/campagne-sql.repository.db'
import { CreateCampagneCommandHandler } from './application/commands/create-campagne.command'
import { GetJeuneHomeDemarchesQueryHandler } from './application/queries/get-jeune-home-demarches.query.handler'
import { GetJeuneHomeActionsQueryHandler } from './application/queries/get-jeune-home-actions.query.handler'
import { GetCampagneQueryModel } from './application/queries/query-getters/get-campagne.query.getter'
import { CreateEvaluationCommandHandler } from './application/commands/create-evaluation.command'
import { DemarcheHttpRepositoryDb } from './infrastructure/repositories/demarche-http.repository.db'
import { Demarche, DemarcheRepositoryToken } from './domain/demarche'
import { UpdateStatutDemarcheCommandHandler } from './application/commands/update-demarche.command.handler'
import { CreateDemarcheCommandHandler } from './application/commands/create-demarche.command.handler'
import { FilesController } from './infrastructure/routes/fichiers.controller'
import { TelechargerFichierQueryHandler } from './application/queries/telecharger-fichier.query.handler'

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
    OffresEmploiController,
    OffresImmersionController,
    ConseillersController,
    HealthController,
    RendezVousController,
    AuthentificationController,
    ReferentielsController,
    EvenementsController,
    RecherchesController,
    FavorisController,
    ServicesCiviqueController,
    CampagnesController,
    FilesController
  ],
  providers: [
    ...buildQueryCommandsProviders(),
    FirebaseClient,
    OidcAuthGuard,
    ApiKeyAuthGuard,
    JwtService,
    IdService,
    DateService,
    ChatCryptoService,
    PoleEmploiClient,
    ImmersionClient,
    EngagementClient,
    PoleEmploiPartenaireClient,
    ObjectStorageClient,
    Action.Factory,
    Mail.Factory,
    Authentification.Factory,
    Campagne.Factory,
    Demarche.Factory,
    Fichier.Factory,
    WorkerService,
    TaskService,
    InvitationIcsClient,
    KeycloakClient,
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
      provide: MiloRepositoryToken,
      useClass: MiloHttpSqlRepository
    },
    {
      provide: OffresImmersionRepositoryToken,
      useClass: OffresImmersionHttpSqlRepository
    },
    {
      provide: PlanificateurRepositoryToken,
      useClass: PlanificateurRedisRepository
    },
    {
      provide: EvenementsRepositoryToken,
      useClass: EvenementHttpSqlRepository
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
      useClass: DemarcheHttpRepositoryDb
    },
    {
      provide: FichierRepositoryToken,
      useClass: FichierSqlS3Repository
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
    AuthorizeConseillerForJeunes,
    FavoriOffreServiceCiviqueAuthorizer,
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
    GetResumeActionsDesJeunesDuConseillerQueryHandler,
    UpdateNotificationTokenCommandHandler,
    UpdateStatutActionCommandHandler,
    CreateRendezVousCommandHandler,
    DeleteRendezVousCommandHandler,
    GetAllRendezVousConseillerQueryHandler,
    GetRendezVousJeuneQueryHandler,
    GetRendezVousJeunePoleEmploiQueryHandler,
    SendNotificationNouveauMessageCommandHandler,
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
    HandleJobRappelRendezVousCommandHandler,
    HandleJobMailConseillerCommandHandler,
    SynchronizeJobsCommandHandler,
    GetConseillerByEmailQueryHandler,
    TransfererJeunesConseillerCommandHandler,
    InitCronsCommandHandler,
    HandleJobNotifierNouvellesOffresEmploiCommandHandler,
    HandleJobRecupererSituationsJeunesMiloCommandHandler,
    GetServicesCiviqueQueryHandler,
    GetDetailServiceCiviqueQueryHandler,
    HandleNettoyerLesJobsCommandHandler,
    CreerSuperviseursCommandHandler,
    DeleteSuperviseursCommandHandler,
    GetTypesRendezVousQueryHandler,
    NotifierNouvellesImmersionsCommandHandler,
    AddFavoriOffreServiceCiviqueCommandHandler,
    GetFavorisServiceCiviqueJeuneQueryHandler,
    DeleteFavoriOffreEngagementCommandHandler,
    DeleteJeuneCommandHandler,
    DeleteJeuneInactifCommandHandler,
    GetDetailRendezVousQueryHandler,
    GetActionsJeunePoleEmploiQueryHandler,
    GetJeuneMiloByDossierQueryHandler,
    UpdateRendezVousCommandHandler,
    GetConseillersJeuneQueryHandler,
    GetAgencesQueryHandler,
    HandleJobUpdateMailingListConseillerCommandHandler,
    ModifierConseillerCommandHandler,
    HandleJobNotifierNouveauxServicesCiviqueCommandHandler,
    CreateCampagneCommandHandler,
    GetJeuneHomeDemarchesQueryHandler,
    GetJeuneHomeActionsQueryHandler,
    GetCampagneQueryModel,
    CreateEvaluationCommandHandler,
    UpdateStatutDemarcheCommandHandler,
    CreateDemarcheCommandHandler,
    TeleverserFichierCommandHandler,
    TelechargerFichierQueryHandler
  ]
}

@Module(buildModuleMetadata())
export class AppModule {}
