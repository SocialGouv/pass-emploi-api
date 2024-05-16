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
  const peConseiller: SecuritySchemeObject = {
    type: 'oauth2',
    description: 'Conseiller France Travail',
    flows: {
      authorizationCode: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth?kc_idp_hint=pe-conseiller`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: { openid: 'ok', email: 'oui', profile: '' }
      }
    }
  }
  const peJeune: SecuritySchemeObject = {
    type: 'oauth2',
    description: 'Conseiller France Travail',
    flows: {
      authorizationCode: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth?kc_idp_hint=pe-jeune`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: { openid: 'ok', email: 'oui', profile: '' }
      }
    }
  }
  const peConseillerBRSA: SecuritySchemeObject = {
    type: 'oauth2',
    description: 'Conseiller France Travail',
    flows: {
      authorizationCode: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth?kc_idp_hint=pe-brsa-conseiller`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: { openid: 'ok', email: 'oui', profile: '' }
      }
    }
  }
  const peJeuneBRSA: SecuritySchemeObject = {
    type: 'oauth2',
    description: 'Conseiller France Travail',
    flows: {
      authorizationCode: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth?kc_idp_hint=pe-brsa-jeune`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: { openid: 'ok', email: 'oui', profile: '' }
      }
    }
  }
  const miloConseiller: SecuritySchemeObject = {
    type: 'oauth2',
    description: 'Conseiller France Travail',
    flows: {
      authorizationCode: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth?kc_idp_hint=similo-conseiller`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: { openid: 'ok', email: 'oui', profile: '' }
      }
    }
  }
  const miloJeune: SecuritySchemeObject = {
    type: 'oauth2',
    description: 'Conseiller France Travail',
    flows: {
      authorizationCode: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth?kc_idp_hint=similo-jeune`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: { openid: 'ok', email: 'oui', profile: '' }
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
    .addOAuth2(peConseiller)
    .addOAuth2(peConseillerBRSA)
    .addOAuth2(peJeune)
    .addOAuth2(peJeuneBRSA)
    .addOAuth2(miloJeune)
    .addOAuth2(miloConseiller)
    .addSecurity('api_key', apiKeySecuritySchemeObject)
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: `${baserUrl}/documentation/oauth2-redirect.html`,
      initOAuth: {
        clientId: 'pass-emploi-swagger',
        clientSecret: 'jopa',
        scopes: ['openid', 'email', 'profile'],
        scopeSeparator: ' ',
        usePkceWithAuthorizationCodeGrant: true,
        useBasicAuthenticationWithAccessCodeGrant: true
      }
    }
  }
  SwaggerModule.setup('documentation', app, document, customOptions)
}
