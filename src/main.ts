import { WorkerService } from './application/worker.service'
import { initializeAPMAgent } from './infrastructure/monitoring/apm.init'
initializeAPMAgent()

import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule
} from '@nestjs/swagger'
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { SynchronizeJobsCommandHandler } from './application/commands/synchronize-jobs.command'

function useSwagger(
  appConfig: ConfigService,
  app: NestExpressApplication
): void {
  const issuerUrl = appConfig.get('oidc.issuerUrl')
  const baserUrl = appConfig.get('baseUrl')
  const oauth2SecuritySchemeObject: SecuritySchemeObject = {
    type: 'oauth2',
    description: 'client_id: pass-emploi-swagger',
    flows: {
      implicit: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: {}
      }
    }
  }
  const apiKeySecuritySchemeObject: SecuritySchemeObject = {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-KEY'
  }
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pass Emploi Api')
    .setVersion('1.0')
    .addOAuth2(oauth2SecuritySchemeObject)
    .addSecurity('api_key', apiKeySecuritySchemeObject)
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: `${baserUrl}/documentation/oauth2-redirect.html`
    }
  }
  SwaggerModule.setup('documentation', app, document, customOptions)
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true
  })
  const appConfig = app.get<ConfigService>(ConfigService)
  const port = appConfig.get('port')
  const isWorker = appConfig.get('isWorker')
  const isWeb = appConfig.get('isWeb')
  const tasks = appConfig.get('tasks')
  app.useLogger(app.get(Logger))

  if (isWorker) {
    app.get(WorkerService).subscribe()
  }
  if (isWeb) {
    useSwagger(appConfig, app)
    app.enableCors()
    app.useGlobalPipes(new ValidationPipe())
    app.disable('x-powered-by')
    await app.listen(port)
  }

  if (tasks && tasks.initAllJobs) {
    const synchronizeJobsCommandHandler =
      app.get<SynchronizeJobsCommandHandler>(SynchronizeJobsCommandHandler)
    await synchronizeJobsCommandHandler.execute({})
    await app.close()
    process.exit(0)
  }
}

bootstrap()
