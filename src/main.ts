import { Context } from './building-blocks/context'
import { ContextInterceptor } from './infrastructure/middlewares/context.interceptor'
import { initializeAPMAgent } from './infrastructure/monitoring/apm.init'

initializeAPMAgent()

import * as compression from 'compression'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { TaskService } from './application/task.service'
import { WorkerService } from './application/worker.service.db'
import { useSwagger } from './infrastructure/middlewares/swagger.middleware'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true
  })
  const appConfig = app.get<ConfigService>(ConfigService)
  const port = appConfig.get('port')
  const isWorker = appConfig.get('isWorker')
  const isWeb = appConfig.get('isWeb')
  const task = appConfig.get('task')
  const logger = app.get(Logger)
  const context = app.get(Context)
  app.useLogger(logger)

  if (isWeb) {
    app.use(compression())
    useSwagger(appConfig, app)
    app.use(helmet())
    app.enableCors()
    app.useGlobalInterceptors(new ContextInterceptor(context))
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

  if (task?.name) {
    await app.get(TaskService).handle(task.name, task.date)
    await app.close()
    process.exit(0)
  }
}

bootstrap()
