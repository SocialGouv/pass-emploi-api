import { HttpModule } from '@nestjs/axios'
import { Provider, Type } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { TerminusModule } from '@nestjs/terminus'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import { messaging } from 'firebase-admin'
import { JWTPayload } from 'jose'
import {
  buildModuleMetadata,
  buildQueryCommandsProviders
} from '../../src/app.module'
import configuration from '../../src/config/configuration'
import { Authentification } from '../../src/domain/authentification'
import {
  IJwtService,
  JwtService
} from '../../src/infrastructure/auth/jwt.service'
import { OidcAuthGuard } from '../../src/infrastructure/auth/oidc.auth-guard'
import {
  FirebaseClient,
  IFirebaseClient
} from '../../src/infrastructure/clients/firebase-client'
import { unJwtPayloadValide } from '../fixtures/authentification.fixture'
import TokenMessage = messaging.TokenMessage

export function buildTestingModuleForHttpTesting(): TestingModuleBuilder {
  const moduleMetadata = buildModuleMetadata()
  return Test.createTestingModule({
    imports: [
      HttpModule,
      ConfigModule.forRoot({
        load: [configuration]
      }),
      TerminusModule
    ],
    providers: stubProviders(),
    controllers: moduleMetadata.controllers
  })
}

export const testConfig = (): ConfigService => {
  return new ConfigService({
    poleEmploi: {
      url: 'https://api.emploi-store.fr/partenaire',
      loginUrl:
        'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token',
      clientId: 'pole-emploi-client-id',
      clientSecret: 'pole-emploi-client-secret',
      scope: 'pole-emploi-scope'
    },
    poleEmploiPrestations: {
      url: 'https://api-r.es-qvr.fr/partenaire/peconnect-gerer-prestations/v1'
    },
    milo: {
      url: 'https://milo.com',
      apiKeyRecupererDossier: 'apiKeyRecupererDossier',
      apiKeyCreerJeune: 'apiKeyCreerJeune'
    },
    redis: {
      // eslint-disable-next-line no-process-env
      url: process.env.REDIS_URL || 'redis://localhost:6767'
    },
    planificateur: {
      url: 'https://planification.com'
    },
    sendinblue: {
      url: 'https://sendinblue.com',
      apiKey: 'sendinblueapiKey',
      templateId: '21'
    },
    serviceCivique: {
      url: 'https://api.api-engagement.beta.gouv.op',
      apiKey: 'apiKey'
    },
    immersion: {
      url: 'https://api.api-immersion.beta.gouv.op',
      apiKey: 'apiKey'
    },
    frontEndUrl: 'http://frontend.com',
    jobs: {
      notificationRecherches: {
        nombreDeRequetesEnParallele: '5'
      },
      mailConseillers: {
        nombreDeConseillersEnParallele: '100'
      }
    }
  })
}

const stubProviders = (): Provider[] => {
  const providers: Provider[] = [
    {
      provide: JwtService,
      useClass: FakeJwtService
    },
    {
      provide: APP_GUARD,
      useClass: OidcAuthGuard
    },
    {
      provide: FirebaseClient,
      useClass: FakeFirebaseClient
    }
  ]
  const queryCommandsProviders = buildQueryCommandsProviders().map(
    (provider: Provider): Provider => {
      return {
        provide: provider as Type,
        useClass: FakeHandler
      }
    }
  )
  return providers.concat(queryCommandsProviders)
}

class FakeHandler {
  execute(): Promise<unknown> {
    return Promise.resolve(undefined)
  }
}

export class FakeJwtService implements IJwtService {
  private valid: boolean

  constructor(valid = true) {
    this.valid = valid
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async verifyTokenAndGetJwt(_token: string): Promise<JWTPayload> {
    if (this.valid) {
      return unJwtPayloadValide()
    }
    throw new Error('JWT invalid')
  }
}

class FakeFirebaseClient implements IFirebaseClient {
  getToken(_utilisateur: Authentification.Utilisateur): Promise<string> {
    return Promise.resolve('un-token-firebase')
  }

  initializeChatIfNotExists(
    _jeuneId: string,
    _conseillerId: string
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  send(_tokenMessage: TokenMessage): Promise<void> {
    return Promise.resolve(undefined)
  }
}
