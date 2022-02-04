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
import { Task, TaskService } from './application/task.service'
import { WorkerService } from './application/worker.service'

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
  const logger = app.get(Logger)
  app.useLogger(logger)

  if (isWeb) {
    useSwagger(appConfig, app)
    app.enableCors()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    app.disable('x-powered-by')
    await app.listen(port)
  }
  app.flushLogs()

  if (isWorker) {
    logger.log('mode worker activated')
    const worker = app.get(WorkerService)
    worker.subscribe()
  }

  if (tasks) {
    logger.log({ tasks })
    const task: Task | undefined = tasks.initAllJobs
      ? Task.INIT_ALL_JOBS
      : tasks.dummyJob
      ? Task.DUMMY_JOB
      : undefined
    await app.get(TaskService).handle(task)
    await app.close()
    process.exit(0)
  }
}

bootstrap()
