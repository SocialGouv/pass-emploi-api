import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule
} from '@nestjs/swagger'
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'

export function useSwagger(
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
