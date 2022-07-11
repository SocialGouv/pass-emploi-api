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
import { FakeController } from '../infrastructure/auth/fake.controller'
import TokenMessage = messaging.TokenMessage

export function buildTestingModuleForHttpTesting(): TestingModuleBuilder {
  const moduleMetadata = buildModuleMetadata()
  return Test.createTestingModule({
    imports: [HttpModule, ConfigModule.forRoot(), TerminusModule],
    providers: stubProviders(),
    controllers: [...moduleMetadata.controllers!, FakeController]
  })
}

export const testConfig = (): ConfigService => {
  return new ConfigService({
    environment: 'test',
    poleEmploi: {
      url: 'https://api.emploi-store.fr/partenaire',
      loginUrl:
        'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token',
      clientId: 'pole-emploi-client-id',
      clientSecret: 'pole-emploi-client-secret',
      scope: 'pole-emploi-scope'
    },
    poleEmploiPartenaire: {
      url: 'https://api-r.es-qvr.fr/partenaire'
    },
    milo: {
      url: 'https://milo.com',
      urlWeb: 'https://milo.com',
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
      templates: {
        conversationsNonLues: '200',
        nouveauRendezvous: '300',
        rappelRendezvous: '400',
        compteJeuneArchive: '500'
      }
    },
    serviceCivique: {
      url: 'https://api.api-engagement.beta.gouv.op',
      apiKey: 'apiKey'
    },
    immersion: {
      url: 'https://api.api-immersion.beta.gouv.op',
      apiKey: 'apiKey'
    },
    firebase: {
      key: 'firebase-key',
      encryptionKey: 'firebase-encryption-key'
    },
    passEmploiContactEmail: 'pass.emploi.contact@gmail.com',
    frontEndUrl: 'http://frontend.com',
    jobs: {
      notificationRecherches: {
        nombreDeRequetesEnParallele: '5'
      },
      mailConseillers: {
        nombreDeConseillersEnParallele: '100'
      }
    },
    apiKeys: {
      keycloak: 'ceci-est-une-api-key',
      immersion: 'ceci-est-une-autre-api-key'
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
    },
    {
      provide: ConfigService,
      useValue: testConfig()
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
