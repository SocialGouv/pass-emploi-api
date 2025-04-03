import { HttpModule } from '@nestjs/axios'
import {
  INestApplication,
  Provider,
  Type,
  ValidationPipe
} from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { TerminusModule } from '@nestjs/terminus'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import { messaging } from 'firebase-admin'
import { JWTPayload } from 'jose'
import { parse } from 'pg-connection-string'
import { createSandbox, SinonSandbox } from 'sinon'
import {
  buildModuleMetadata,
  buildQueryCommandsProviders
} from 'src/app.module'
import { Authentification } from 'src/domain/authentification'
import { IJwtService, JwtService } from 'src/infrastructure/auth/jwt.service'
import { OidcAuthGuard } from 'src/infrastructure/auth/oidc.auth-guard'
import { FirebaseClient } from 'src/infrastructure/clients/firebase-client'
import { DateService } from 'src/utils/date-service'
import { unJwtPayloadValide } from '../fixtures/authentification.fixture'
import { uneDatetime } from '../fixtures/date.fixture'
import { FakeController } from '../infrastructure/auth/fake.controller'
import { stubClass, stubClassSandbox } from './types'
import TokenMessage = messaging.TokenMessage

export function buildTestingModuleForHttpTesting(
  sandbox: SinonSandbox = createSandbox()
): TestingModuleBuilder {
  const moduleMetadata = buildModuleMetadata()
  return Test.createTestingModule({
    imports: [HttpModule, ConfigModule.forRoot(), TerminusModule],
    providers: stubProviders(sandbox),
    controllers: [...moduleMetadata.controllers!, FakeController]
  })
}
export function buildTestingModuleForEndToEndTesting(): TestingModuleBuilder {
  const moduleMetadata = buildModuleMetadata()
  return Test.createTestingModule({
    imports: [HttpModule, ConfigModule.forRoot(), TerminusModule],
    providers: [...moduleMetadata.providers!],
    controllers: [...moduleMetadata.controllers!, FakeController]
  })
}

let applicationForHttpTesting: INestApplication
let sandbox: SinonSandbox

export const getApplicationWithStubbedDependencies =
  async (): Promise<INestApplication> => {
    if (!applicationForHttpTesting) {
      sandbox = createSandbox()
      const testingModule = await buildTestingModuleForHttpTesting(sandbox)
        .overrideProvider(JwtService)
        .useClass(FakeJwtService)
        .compile()

      applicationForHttpTesting = testingModule.createNestApplication()
      applicationForHttpTesting.useGlobalPipes(
        new ValidationPipe({ whitelist: true })
      )
      await applicationForHttpTesting.init()
    }

    afterEach(() => {
      sandbox.reset()
    })
    return applicationForHttpTesting
  }

export const testConfig = (): ConfigService => {
  // eslint-disable-next-line no-process-env
  const databaseUrl = process.env.DATABASE_URL as string
  const { host, port, database, user, password } = parse(databaseUrl)
  return new ConfigService({
    environment: 'test',
    database: {
      host,
      port,
      database,
      user,
      password
    },
    poleEmploi: {
      url: 'https://api.peio.pe-qvr.fr/partenaire',
      loginUrl:
        'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token',
      clientId: 'pole-emploi-client-id',
      clientSecret: 'pole-emploi-client-secret',
      scope: 'pole-emploi-scope'
    },
    milo: {
      url: 'https://milo.com',
      urlWeb: 'https://milo.com',
      apiKeyDossier: 'apiKeyDossier',
      apiKeyCreerJeune: 'apiKeyCreerJeune',
      apiKeyEvents: 'apiKeyEvents',
      apiKeyDetailRendezVous: 'apiKeyDetailRendezVous',
      apiKeyInstanceSessionLecture: 'apiKeyInstanceSessionLecture',
      apiKeyInstanceSessionEcritureConseiller:
        'apiKeyInstanceSessionEcritureConseiller',
      apiKeyInstanceSessionAnnulationJeune:
        'apiKeyInstanceSessionAnnulationJeune',
      apiKeySessionDetailConseiller: 'apiKeySessionDetailConseiller',
      apiKeySessionsDetailEtListeJeune: 'apiKeySessionsDetailEtListeJeune',
      apiKeySessionsListeConseiller: 'apiKeySessionsListeConseiller',
      apiKeyUtilisateurs: 'apiKeyUtilisateurs'
    },
    redis: {
      // eslint-disable-next-line no-process-env
      url: process.env.REDIS_URL || 'redis://localhost:6767'
    },
    planificateur: {
      url: 'https://planification.com'
    },
    brevo: {
      url: 'https://brevo.com',
      apiKey: 'brevoApiKey',
      templates: {
        conversationsNonLues: '200',
        conversationsNonLuesPassEmploi: '363',
        nouveauRendezvous: '300',
        rappelRendezvous: '400',
        compteJeuneArchiveMILO: '500',
        compteJeuneArchivePECEJ: '501',
        compteJeuneArchivePEBRSA: '502'
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
    cje: {
      apiUrl: 'https://cje.com/api',
      apiKey: 'cjekey'
    },
    diagoriente: {
      url: 'https://api-dev.diagoriente.fr',
      clientId: 'diagoriente-client-id',
      clientSecret: 'diagoriente-client-secret'
    },
    jecliqueoupas: {
      url: 'https://jecliqueoupas.fr/api',
      token: 'token-jecliqueoupas',
      cert: 'CERT_BASE64',
      ip: '1.2.3.4',
      intervalleAnalyse: 15
    },
    firebase: {
      key: '{"type": "service_account","project_id": "pass-emploi-test","private_key_id": "xx","private_key": "xx","client_email": "test@pass-emploi-test.iam.gserviceaccount.com","client_id": "xx","auth_uri": "https://accounts.google.com/o/oauth2/auth","token_uri": "https://oauth2.googleapis.com/token","auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test"}',
      encryptionKey: 'firebase-encryption-key'
    },
    noReplyContactEmail: 'no-reply@pass-emploi.beta.gouv.fr',
    frontEndUrl: 'http://frontend.com',
    matomo: {
      siteId: 0,
      url: 'https://url.matomo.test'
    },
    mattermost: {
      jobWebhookUrl: 'https://mattermost.incubateur.net/hooks/xxx'
    },
    monitoring: {
      dashboardUrl: 'https://elastic.com'
    },
    jobs: {
      notificationRecherches: {
        nombreDeRequetesEnParallele: '5'
      },
      mailConseillers: {
        nombreDeConseillersEnParallele: '100'
      }
    },
    apiKeys: {
      keycloak: ['api-key-keycloak'],
      immersion: ['api-key-immersion'],
      support: ['api-key-support'],
      poleEmploi: ['api-key-consumer-pole-emploi']
    },
    features: {
      notifierRendezVousMilo: true,
      recupererStructureMilo: true
    },
    oidc: {
      issuerUrl: 'https://pass-emploi-connect.com',
      issuerApiUrl: 'https://pass-emploi-connect-api.com',
      clientId: 'client',
      clientSecret: 'chut'
    },
    values: {
      maxRechercheConseillers: '5'
    },
    headers: {
      staleIfErrorSeconds: '60',
      maxAgeMobile: '600',
      maxAgeReferentiels: '600',
      maxAgeCV: '600',
      maxAgeSuggestions: '600',
      maxAgeMinimal: '5',
      staleIfErrorAgeMinimal: '5'
    },
    remoteConfig: { conseillersCVM: ['ok'] }
  })
}

const stubProviders = (sandbox: SinonSandbox): Provider[] => {
  const dateService = stubClass(DateService)
  dateService.now.returns(uneDatetime())
  const jwtService = stubClass(JwtService)
  jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  const providers: Provider[] = [
    {
      provide: JwtService,
      useValue: jwtService
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
    },
    {
      provide: DateService,
      useValue: dateService
    }
  ]
  const queryCommandsProviders = buildQueryCommandsProviders().map(
    (provider: Provider): Provider => {
      return {
        provide: provider as Type,
        useValue: stubClassSandbox(provider as Type, sandbox)
      }
    }
  )
  return providers.concat(queryCommandsProviders)
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

class FakeFirebaseClient {
  getToken(_utilisateur: Authentification.Utilisateur): Promise<string> {
    return Promise.resolve('un-pushNotificationToken-firebase')
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
