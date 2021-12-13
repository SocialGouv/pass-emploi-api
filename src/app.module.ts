import { HttpModule } from '@nestjs/axios'
import { Module, ModuleMetadata, Provider } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { TerminusModule } from '@nestjs/terminus'
import { AddFavoriOffreEmploiCommandHandler } from './application/commands/add-favori-offre-emploi.command.handler'
import { CreateActionCommandHandler } from './application/commands/create-action.command.handler'
import { CreateJeuneCommandHandler } from './application/commands/create-jeune.command.handler'
import { CreateRendezVousCommandHandler } from './application/commands/create-rendez-vous.command.handler'
import { DeleteActionCommandHandler } from './application/commands/delete-action.command.handler'
import { DeleteFavoriOffreEmploiCommandHandler } from './application/commands/delete-favori-offre-emploi.command.handler'
import { DeleteRendezVousCommandHandler } from './application/commands/delete-rendez-vous.command.handler'
import { LoginJeuneCommandHandler } from './application/commands/login-jeune.command.handler'
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
import { GetFavorisIdsJeuneQueryHandler } from './application/queries/get-favoris-ids-jeune.query.handler'
import { GetFavorisJeuneQueryHandler } from './application/queries/get-favoris-jeune.query.handler'
import { GetHomeJeuneHandler } from './application/queries/get-home-jeune.query.handler'
import { GetJeunesByConseillerQueryHandler } from './application/queries/get-jeunes-by-conseiller.query.handler'
import { GetOffresEmploiQueryHandler } from './application/queries/get-offres-emploi.query.handler'
import { GetAllRendezVousConseillerQueryHandler } from './application/queries/get-rendez-vous-conseiller.query.handler'
import { GetAllRendezVousJeuneQueryHandler } from './application/queries/get-rendez-vous-jeune.query.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandler } from './application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import configuration from './config/configuration'
import { Action, ActionsRepositoryToken } from './domain/action'
import {
  Authentification,
  AuthentificationRepositoryToken
} from './domain/authentification'
import { ChatsRepositoryToken } from './domain/chat'
import { ConseillersRepositoryToken } from './domain/conseiller'
import { JeunesRepositoryToken } from './domain/jeune'
import { NotificationRepositoryToken } from './domain/notification'
import { OffresEmploiRepositoryToken } from './domain/offre-emploi'
import { RendezVousRepositoryToken } from './domain/rendez-vous'
import { ApiKeyAuthGuard } from './infrastructure/auth/api-key.auth-guard'
import { JwtService } from './infrastructure/auth/jwt.service'
import { OidcAuthGuard } from './infrastructure/auth/oidc.auth-guard'
import { FirebaseClient } from './infrastructure/clients/firebase-client'
import { PoleEmploiClient } from './infrastructure/clients/pole-emploi-client'
import { ActionSqlRepository } from './infrastructure/repositories/action-sql.repository'
import { AuthentificationSqlRepository } from './infrastructure/repositories/authentification-sql.repository'
import { ChatFirebaseRepository } from './infrastructure/repositories/chat-firebase.repository'
import { ConseillerSqlRepository } from './infrastructure/repositories/conseiller-sql.repository'
import { JeuneSqlRepository } from './infrastructure/repositories/jeune-sql.repository'
import { NotificationFirebaseRepository } from './infrastructure/repositories/notification-firebase.repository'
import { OffresEmploiHttpSqlRepository } from './infrastructure/repositories/offre-emploi-http-sql.repository'
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
    ConseillersController,
    HealthController,
    RendezVousController,
    AuthentificationController,
    ReferentielsController
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
    Action.Factory,
    Authentification.Factory,
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
      provide: ChatsRepositoryToken,
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
    ...databaseProviders
  ],
  exports: [...databaseProviders]
})

export function buildQueryCommandsProviders(): Provider[] {
  return [
    GetDetailActionQueryHandler,
    GetDetailJeuneQueryHandler,
    GetActionsByJeuneQueryHandler,
    CreateActionCommandHandler,
    CreateJeuneCommandHandler,
    AddFavoriOffreEmploiCommandHandler,
    DeleteFavoriOffreEmploiCommandHandler,
    GetFavorisIdsJeuneQueryHandler,
    GetFavorisJeuneQueryHandler,
    GetHomeJeuneHandler,
    GetOffresEmploiQueryHandler,
    GetDetailOffreEmploiQueryHandler,
    GetDetailConseillerQueryHandler,
    GetJeunesByConseillerQueryHandler,
    GetResumeActionsDesJeunesDuConseillerQueryHandler,
    LoginJeuneCommandHandler,
    UpdateNotificationTokenCommandHandler,
    UpdateStatutActionCommandHandler,
    CreateRendezVousCommandHandler,
    DeleteRendezVousCommandHandler,
    GetAllRendezVousConseillerQueryHandler,
    GetAllRendezVousJeuneQueryHandler,
    SendNotificationNouveauMessageCommandHandler,
    DeleteActionCommandHandler,
    UpdateUtilisateurCommandHandler,
    GetCommunesEtDepartementsQueryHandler
  ]
}

@Module(buildModuleMetadata())
export class AppModule {}
