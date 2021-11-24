import { HttpModule } from '@nestjs/axios'
import {
  MiddlewareConsumer,
  Module,
  ModuleMetadata,
  Provider
} from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'
import { CreateActionCommandHandler } from './application/commands/create-action.command.handler'
import { CreateJeuneCommandHandler } from './application/commands/create-jeune.command.handler'
import { CreateRendezVousCommandHandler } from './application/commands/create-rendez-vous.command.handler'
import { DeleteActionCommandHandler } from './application/commands/delete-action.command.handler'
import { DeleteRendezVousCommandHandler } from './application/commands/delete-rendez-vous.command.handler'
import { LoginJeuneCommandHandler } from './application/commands/login-jeune.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from './application/commands/send-notification-nouveau-message.command.handler'
import { UpdateNotificationTokenCommandHandler } from './application/commands/update-notification-token.command.handler'
import { UpdateStatutActionCommandHandler } from './application/commands/update-statut-action.command.handler'
import { GetActionsByJeuneQueryHandler } from './application/queries/get-actions-by-jeune.query.handler'
import { GetDetailActionQueryHandler } from './application/queries/get-detail-action.query.handler'
import { GetDetailJeuneQueryHandler } from './application/queries/get-detail-jeune.query.handler'
import { GetDetailOffreEmploiQueryHandler } from './application/queries/get-detail-offre-emploi.query.handler'
import { GetHomeJeuneHandler } from './application/queries/get-home-jeune.query.handler'
import { GetOffresEmploiQueryHandler } from './application/queries/get-offres-emploi.query.handler'
import { GetAllRendezVousConseillerQueryHandler } from './application/queries/get-rendez-vous-conseiller.query.handler'
import { GetAllRendezVousJeuneQueryHandler } from './application/queries/get-rendez-vous-jeune.query.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandler } from './application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import configuration from './config/configuration'
import { Action, ActionsRepositoryToken } from './domain/action'
import { ChatsRepositoryToken } from './domain/chat'
import { ConseillersRepositoryToken } from './domain/conseiller'
import { JeunesRepositoryToken } from './domain/jeune'
import { NotificationRepositoryToken } from './domain/notification'
import { RendezVousRepositoryToken } from './domain/rendez-vous'
import { OffresEmploiRepositoryToken } from './domain/offres-emploi'
import { ActionSqlRepository } from './infrastructure/repositories/action-sql.repository'
import { ChatFirebaseRepository } from './infrastructure/repositories/chat-firebase.repository'
import { ConseillerSqlRepository } from './infrastructure/repositories/conseiller-sql.repository'
import { FirebaseClient } from './infrastructure/repositories/firebase-client'
import { JeuneSqlRepository } from './infrastructure/repositories/jeune-sql.repository'
import { NotificationFirebaseRepository } from './infrastructure/repositories/notification-firebase.repository'
import { OffresEmploiHttpSqlRepository } from './infrastructure/repositories/offre-emploi-http-sql.repository'
import { RendezVousRepositorySql } from './infrastructure/repositories/rendez-vous-sql.repository'
import { ActionsController } from './infrastructure/routes/actions.controller'
import { ConseillersController } from './infrastructure/routes/conseillers.controller'
import { HealthController } from './infrastructure/routes/health.controller'
import { AppLoggerMiddleware } from './infrastructure/routes/http-logger'
import { JeunesController } from './infrastructure/routes/jeunes.controller'
import { OffresEmploiController } from './infrastructure/routes/offres-emploi.controller'
import { RendezVousController } from './infrastructure/routes/rendez-vous.controller'
import { databaseProviders } from './infrastructure/sequelize/providers'
import { DateService } from './utils/date-service'
import { IdService } from './utils/id-service'
import { PoleEmploiClient } from './infrastructure/clients/pole-emploi-client'
import { GetDetailConseillerQueryHandler } from './application/queries/get-detail-conseiller.query.handler'
import { GetJeunesByConseillerQueryHandler } from './application/queries/get-jeunes-by-conseiller.query.handler'
import { AddFavoriOffreEmploiCommandHandler } from './application/commands/add-favori-offre-emploi.command.handler'

export const buildModuleMetadata = (): ModuleMetadata => ({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.environment',
      load: [configuration]
    }),
    HttpModule,
    TerminusModule
  ],
  controllers: [
    ActionsController,
    JeunesController,
    OffresEmploiController,
    ConseillersController,
    HealthController,
    RendezVousController
  ],
  providers: [
    ...buildQueryCommandsProviders(),
    FirebaseClient,
    IdService,
    DateService,
    PoleEmploiClient,
    Action.Factory,
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
    DeleteActionCommandHandler
  ]
}

@Module(buildModuleMetadata())
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*')
  }
}
