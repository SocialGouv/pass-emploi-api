import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule
} from '@nestjs/swagger'
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'

export enum IDPName {
  FT_BENEFICIAIRE = 'ft-beneficiaire',
  PE_CONSEILLER = 'pe-conseiller',
  PE_BRSA_CONSEILLER = 'pe-brsa-conseiller',
  PE_AIJ_CONSEILLER = 'pe-aij-conseiller',
  SIMILO_JEUNE = 'similo-jeune',
  SIMILO_CONSEILLER = 'similo-conseiller',
  CONSEILLER_DEPT = 'conseildepartemental-conseiller'
}

export function useSwagger(
  appConfig: ConfigService,
  app: NestExpressApplication
): void {
  const issuerUrl = appConfig.get('oidc.issuerUrl')
  const baserUrl = appConfig.get('baseUrl')
  const apiKeySecuritySchemeObject: SecuritySchemeObject = {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-KEY'
  }
  const swaggerConfigBuilder = new DocumentBuilder()
    .setTitle('Pass Emploi Api')
    .setVersion('1.0')
    .addSecurity('api_key', apiKeySecuritySchemeObject)

  if (appConfig.get('environment') !== 'prod') {
    swaggerConfigBuilder
      .addOAuth2(
        createSecurityScheme(issuerUrl, IDPName.PE_BRSA_CONSEILLER),
        IDPName.PE_BRSA_CONSEILLER
      )
      .addOAuth2(
        createSecurityScheme(issuerUrl, IDPName.PE_AIJ_CONSEILLER),
        IDPName.PE_AIJ_CONSEILLER
      )
      .addOAuth2(
        createSecurityScheme(issuerUrl, IDPName.PE_CONSEILLER),
        IDPName.PE_CONSEILLER
      )
      .addOAuth2(
        createSecurityScheme(issuerUrl, IDPName.FT_BENEFICIAIRE),
        IDPName.FT_BENEFICIAIRE
      )
      .addOAuth2(
        createSecurityScheme(issuerUrl, IDPName.SIMILO_CONSEILLER),
        IDPName.SIMILO_CONSEILLER
      )
      .addOAuth2(
        createSecurityScheme(issuerUrl, IDPName.SIMILO_JEUNE),
        IDPName.SIMILO_JEUNE
      )
      .addOAuth2(
        createSecurityScheme(issuerUrl, IDPName.CONSEILLER_DEPT),
        IDPName.CONSEILLER_DEPT
      )
  }
  const swaggerConfig = swaggerConfigBuilder.build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      oauth2RedirectUrl: `${baserUrl}/documentation/oauth2-redirect.html`,
      initOAuth: {
        // eslint-disable-next-line no-process-env
        clientId: process.env.SWAGGER_CLIENT_ID,
        // eslint-disable-next-line no-process-env
        clientSecret: process.env.SWAGGER_CLIENT_SECRET,
        scopes: ['openid', 'email', 'profile'],
        scopeSeparator: ' ',
        usePkceWithAuthorizationCodeGrant: true,
        useBasicAuthenticationWithAccessCodeGrant: true
      }
    }
  }
  SwaggerModule.setup('documentation', app, document, customOptions)
}

function createSecurityScheme(
  issuerUrl: string,
  idp: IDPName
): SecuritySchemeObject {
  return {
    type: 'oauth2',
    flows: {
      authorizationCode: {
        authorizationUrl: `${issuerUrl}/protocol/openid-connect/auth?kc_idp_hint=${idp}`,
        refreshUrl: `${issuerUrl}/protocol/openid-connect/token`,
        tokenUrl: `${issuerUrl}/protocol/openid-connect/token`,
        scopes: {}
      }
    }
  }
}
