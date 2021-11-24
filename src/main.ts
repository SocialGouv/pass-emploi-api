import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const appConfig = app.get<ConfigService>(ConfigService)
  const port = appConfig.get('port')
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pass Emploi Api')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('documentation', app, document)

  app.enableCors()
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(port)
}

bootstrap()
