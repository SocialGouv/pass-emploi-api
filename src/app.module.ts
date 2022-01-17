/* eslint-disable no-process-env */
import { HttpModule } from '@nestjs/axios'
import { Module, ModuleMetadata, Provider } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { TerminusModule } from '@nestjs/terminus'
import { ActionAuthorizer } from './application/authorizers/authorize-action'
import { ConseillerAuthorizer } from './application/authorizers/authorize-conseiller'
import { ConseillerForJeuneAuthorizer } from './application/authorizers/authorize-conseiller-for-jeune'
import { FavoriAuthorizer } from './application/authorizers/authorize-favori'
import { JeuneAuthorizer } from './application/authorizers/authorize-jeune'
import { RendezVousAuthorizer } from './application/authorizers/authorize-rendezvous'
import { AddFavoriOffreEmploiCommandHandler } from './application/commands/add-favori-offre-emploi.command.handler'
import { CreateActionCommandHandler } from './application/commands/create-action.command.handler'
import { CreerJeunePoleEmploiCommandHandler } from './application/commands/creer-jeune-pole-emploi.command.handler'
import { CreateRendezVousCommandHandler } from './application/commands/create-rendez-vous.command.handler'
import { CreerJeuneMiloCommandHandler } from './application/commands/creer-jeune-milo.command.handler'
import { DeleteActionCommandHandler } from './application/commands/delete-action.command.handler'
import { DeleteFavoriOffreEmploiCommandHandler } from './application/commands/delete-favori-offre-emploi.command.handler'
import { DeleteRendezVousCommandHandler } from './application/commands/delete-rendez-vous.command.handler'
import { HandleJobRendezVousCommandHandler } from './application/commands/handle-job-rendez-vous.command'
import { SendNotificationNouveauMessageCommandHandler } from './application/commands/send-notification-nouveau-message.command.handler'
import { UpdateNotificationTokenCommandHandler } from './application/commands/update-notification-token.command.handler'
import { UpdateStatutActionCommandHandler } from './application/commands/update-statut-action.command.handler'
import { UpdateUtilisateurCommandHandler } from './application/commands/update-utilisateur.command.handler'
import { GetActionsByJeuneQueryHandler } from './application/queries/get-actions-by-jeune.query.handler'
import { GetCommunesEtDepartementsQueryHandler } from './application/queries/get-communes-et-departements.query.handler'
import { GetDetailActionQueryHandler } from './application/queries/get-detail-action.query.handler'
import { GetDetailConseillerQueryHandler } from './application/queries/get-detail-conseiller.query.handler'
import { GetDetailJeuneQueryHandler } from './application/queries/get-detail-jeune.query.handler'
import { GetDetailOffreEmploiQueryHandler } from './application/queries/get-detail-offre-emploi.query.handler'
import { GetDossierMiloJeuneQueryHandler } from './application/queries/get-dossier-milo-jeune.query.handler'
import { GetFavorisIdsJeuneQueryHandler } from './application/queries/get-favoris-ids-jeune.query.handler'
import { GetFavorisJeuneQueryHandler } from './application/queries/get-favoris-jeune.query.handler'
import { GetHomeJeuneHandler } from './application/queries/get-home-jeune.query.handler'
import { GetJeunesByConseillerQueryHandler } from './application/queries/get-jeunes-by-conseiller.query.handler'
import { GetOffresEmploiQueryHandler } from './application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQueryHandler } from './application/queries/get-offres-immersion.query.handler'
import { GetAllRendezVousConseillerQueryHandler } from './application/queries/get-rendez-vous-conseiller.query.handler'
import { GetAllRendezVousJeuneQueryHandler } from './application/queries/get-rendez-vous-jeune.query.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandler } from './application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import { WorkerService } from './application/worker.service'
import configuration from './config/configuration'
import { Action, ActionsRepositoryToken } from './domain/action'
import {
  Authentification,
  AuthentificationRepositoryToken
} from './domain/authentification'
import { ChatRepositoryToken } from './domain/chat'
import { ConseillersRepositoryToken } from './domain/conseiller'
import { JeunesRepositoryToken } from './domain/jeune'
import { MiloRepositoryToken } from './domain/milo'
import { NotificationRepositoryToken } from './domain/notification'
import { OffresEmploiRepositoryToken } from './domain/offre-emploi'
import { OffresImmersionRepositoryToken } from './domain/offre-immersion'
import {
  PlanificateurRepositoryToken,
  PlanificateurService
} from './domain/planificateur'
import { RendezVousRepositoryToken } from './domain/rendez-vous'
import { ApiKeyAuthGuard } from './infrastructure/auth/api-key.auth-guard'
import { JwtService } from './infrastructure/auth/jwt.service'
import { OidcAuthGuard } from './infrastructure/auth/oidc.auth-guard'
import { FirebaseClient } from './infrastructure/clients/firebase-client'
import { PoleEmploiClient } from './infrastructure/clients/pole-emploi-client'
import { ImmersionClient } from './infrastructure/clients/immersion-client'
import { ActionSqlRepository } from './infrastructure/repositories/action-sql.repository'
import { AuthentificationSqlRepository } from './infrastructure/repositories/authentification-sql.repository'
import { ChatFirebaseRepository } from './infrastructure/repositories/chat-firebase.repository'
import { ConseillerSqlEmailRepository } from './infrastructure/repositories/conseiller-sql-email-repository.service'
import { JeuneSqlRepository } from './infrastructure/repositories/jeune-sql.repository'
import { MiloHttpRepository } from './infrastructure/repositories/milo-http.repository'
import { MiloInMemoryRepository } from './infrastructure/repositories/milo-in-memory.repository'
import { NotificationFirebaseRepository } from './infrastructure/repositories/notification-firebase.repository'
import { OffresEmploiHttpSqlRepository } from './infrastructure/repositories/offre-emploi-http-sql.repository'
import { OffresImmersionHttpRepository } from './infrastructure/repositories/offre-immersion-http.repository'
import { PlanificateurRedisRepository } from './infrastructure/repositories/planificateur-redis.repository'
import { RendezVousRepositorySql } from './infrastructure/repositories/rendez-vous-sql.repository'
import { ActionsController } from './infrastructure/routes/actions.controller'
import { AuthentificationController } from './infrastructure/routes/authentification.controller'
import { ConseillersController } from './infrastructure/routes/conseillers.controller'
import { HealthController } from './infrastructure/routes/health.controller'
import { JeunesController } from './infrastructure/routes/jeunes.controller'
import { OffresEmploiController } from './infrastructure/routes/offres-emploi.controller'
import { ReferentielsController } from './infrastructure/routes/referentiels.controller'
import { RendezVousController } from './infrastructure/routes/rendez-vous.controller'
import { databaseProviders } from './infrastructure/sequelize/providers'
import { DateService } from './utils/date-service'
import { IdService } from './utils/id-service'
import { configureLoggerModule } from './utils/logger.module'
import { OffresImmersionController } from './infrastructure/routes/offres-immersion.controller'
import { GetDetailOffreImmersionQueryHandler } from './application/queries/get-detail-offre-immersion.query.handler'
import { EvenementsController } from './infrastructure/routes/evenements.controller'
import { CreateEvenementCommandHandler } from './application/commands/create-evenement.command.handler'
import { GetChatSecretsQueryHandler } from './application/queries/get-chat-secrets.query.handler'
import { EvenementService, EvenementsRepositoryToken } from './domain/evenement'
import { EvenementHttpSqlRepository } from './infrastructure/repositories/evenement-http-sql.repository'
import { HandleJobMailConseillerCommandHandler } from './application/commands/handle-job-mail-conseiller.command'
import { MailSendinblueClient } from './infrastructure/clients/mail-sendinblue.client'
import { SynchronizeJobsCommandHandler } from './application/commands/synchronize-jobs.command'

export const buildModuleMetadata = (): ModuleMetadata => ({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      load: [configuration]
    }),
    configureLoggerModule(),
    HttpModule,
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
    EvenementsController
  ],
  providers: [
    ...buildQueryCommandsProviders(),
    FirebaseClient,
    OidcAuthGuard,
    ApiKeyAuthGuard,
    JwtService,
    IdService,
    DateService,
    PoleEmploiClient,
    ImmersionClient,
    Action.Factory,
    Authentification.Factory,
    WorkerService,
    MailSendinblueClient,
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
      useClass: ConseillerSqlEmailRepository
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
      provide: RendezVousRepositoryToken,
      useClass: RendezVousRepositorySql
    },
    {
      provide: AuthentificationRepositoryToken,
      useClass: AuthentificationSqlRepository
    },
    {
      provide: MiloRepositoryToken,
      useClass:
        process.env.IN_MEMORY == 'true'
          ? MiloInMemoryRepository
          : MiloHttpRepository
    },
    {
      provide: OffresImmersionRepositoryToken,
      useClass: OffresImmersionHttpRepository
    },
    {
      provide: PlanificateurRepositoryToken,
      useClass: PlanificateurRedisRepository
    },
    {
      provide: EvenementsRepositoryToken,
      useClass: EvenementHttpSqlRepository
    },
    ...databaseProviders
  ],
  exports: [...databaseProviders]
})

export function buildQueryCommandsProviders(): Provider[] {
  return [
    ActionAuthorizer,
    ConseillerAuthorizer,
    FavoriAuthorizer,
    JeuneAuthorizer,
    ConseillerForJeuneAuthorizer,
    RendezVousAuthorizer,
    GetDetailActionQueryHandler,
    GetDetailJeuneQueryHandler,
    GetActionsByJeuneQueryHandler,
    CreateActionCommandHandler,
    CreerJeunePoleEmploiCommandHandler,
    AddFavoriOffreEmploiCommandHandler,
    DeleteFavoriOffreEmploiCommandHandler,
    GetFavorisIdsJeuneQueryHandler,
    GetFavorisJeuneQueryHandler,
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
    GetAllRendezVousJeuneQueryHandler,
    SendNotificationNouveauMessageCommandHandler,
    DeleteActionCommandHandler,
    UpdateUtilisateurCommandHandler,
    GetCommunesEtDepartementsQueryHandler,
    GetDossierMiloJeuneQueryHandler,
    CreerJeuneMiloCommandHandler,
    PlanificateurService,
    EvenementService,
    CreateEvenementCommandHandler,
    GetChatSecretsQueryHandler,
    HandleJobRendezVousCommandHandler,
    HandleJobMailConseillerCommandHandler,
    SynchronizeJobsCommandHandler
  ]
}

@Module(buildModuleMetadata())
export class AppModule {}
