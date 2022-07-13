/* eslint-disable */
import { parse } from 'pg-connection-string'
import * as Joi from 'joi'
import { configurationSchema } from './configuration.schema'

export default () => {
  const scalingoApp = process.env.APP
  let baseUrl = ''
  if (scalingoApp && scalingoApp.startsWith('pa-back-staging-pr')) {
    baseUrl = `https://${scalingoApp}.osc-fr1.scalingo.io`
  } else {
    baseUrl = process.env.BASE_URL as string
  }

  const databaseUrl = process.env.DATABASE_URL as string
  const { host, port, database, user, password } = parse(databaseUrl)
  const configuration = {
    environment: process.env.ENVIRONMENT,
    isWeb: process.env.IS_WEB !== 'false',
    isWorker: process.env.IS_WORKER === 'true',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    database: {
      host,
      port,
      database,
      user,
      password,
      acquireConnections: process.env.DATABASE_ACQUIRE_CONNECTIONS || 10000,
      evictConnections: process.env.DATABASE_EVICT_CONNECTIONS || 10000,
      idleConnections: process.env.DATABASE_IDLE_CONNECTIONS || 10000,
      maxConnections: process.env.DATABASE_MAX_CONNECTIONS || 10,
      minConnections: process.env.DATABASE_MIN_CONNECTIONS || 1
    },
    debug: process.env.DEBUG,
    logLevel: process.env.LOG_LEVEL,
    nodeEnv: process.env.NODE_ENV ?? 'production',
    frontEndUrl: process.env.FRONTEND_URL,
    passEmploiContactEmail:
      process.env.PASS_EMPLOI_CONTACT_EMAIL ?? 'pass.emploi.contact@gmail.com',
    baseUrl,
    poleEmploi: {
      url:
        process.env.POLE_EMPLOI_API_BASE_URL ??
        'https://api.emploi-store.fr/partenaire',
      loginUrl:
        process.env.POLE_EMPLOI_LOGIN_URL ??
        'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token',
      clientId: process.env.POLE_EMPLOI_CLIENT_ID ?? '',
      clientSecret: process.env.POLE_EMPLOI_CLIENT_SECRET ?? '',
      scope: process.env.POLE_EMPLOI_SCOPE ?? ''
    },
    poleEmploiPartenaire: {
      url: process.env.POLE_EMPLOI_PARTENAIRE_API_BASE_URL
    },
    milo: {
      url: process.env.MILO_API_URL,
      apiKeyRecupererDossier: process.env.MILO_DOSSIER_API_KEY,
      apiKeyCreerJeune: process.env.MILO_JEUNE_API_KEY,
      urlWeb: process.env.MILO_WEB_URL
    },
    immersion: {
      url:
        process.env.IMMERSION_API_URL ??
        'https://immersion-facile.beta.gouv.fr/api',
      apiKey: process.env.IMMERSION_API_KEY ?? ''
    },
    serviceCivique: {
      url:
        process.env.SERVICE_CIVIQUE_API_URL ??
        'https://api.api-engagement.beta.gouv.fr',
      apiKey: process.env.SERVICE_CIVIQUE_API_KEY ?? ''
    },
    firebase: {
      key: process.env.FIREBASE_SECRET_KEY ?? '',
      encryptionKey: process.env.CHAT_ENCRYPTION_KEY
    },
    oidc: {
      issuerUrl: process.env.OIDC_ISSUER_URL ?? '',
      issuerApiUrl: process.env.OIDC_ISSUER_API_URL ?? '',
      clientId: process.env.OIDC_CLIENT_ID ?? '',
      clientSecret: process.env.OIDC_CLIENT_SECRET ?? ''
    },
    apiKeys: {
      keycloak: process.env.API_KEY_KEYCLOAK,
      immersion: process.env.API_KEY_PARTENAIRE_IMMERSION
    },
    redis: {
      url: process.env.REDIS_URL
    },
    sendinblue: {
      url: process.env.SENDINBLUE_API_URL ?? 'https://api.sendinblue.com',
      apiKey: process.env.SENDINBLUE_API_KEY ?? '',
      templates: {
        conversationsNonLues:
          process.env.SENDINBLUE_CONVERSATIONS_TEMPLATE_ID ?? '2',
        nouveauRendezvous:
          process.env.SENDINBLUE_NOUVEAU_RENDEZVOUS_TEMPLATE_ID ?? '3',
        rappelRendezvous:
          process.env.SENDINBLUE_RAPPEL_RENDEZVOUS_TEMPLATE_ID ?? '18',
        rendezVousSupprime:
          process.env.SENDINBLUE_RENDEZVOUS_SUPPRIME_TEMPLATE_ID ?? '19',
        suppressionJeuneMilo:
          process.env.SENDINBLUE_SUPPRESSION_JEUNE_MILO_ID ?? '14',
        suppressionJeunePE:
          process.env.SENDINBLUE_SUPPRESSION_JEUNE_PE_ID ?? '17',
        compteJeuneArchive:
          process.env.SENDINBLUE_COMPTE_JEUNE_ARCHIVE_ID ?? '51'
      },
      mailingLists: {
        poleEmploi: process.env.SENDINBLUE_POLE_EMPLOI_MAILING_LIST_ID ?? 7,
        milo: process.env.SENDINBLUE_MILO_MAILING_LIST_ID ?? 8
      }
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT ?? 'https://s3.gra.perf.cloud.ovh.net',
      region: process.env.S3_REGION ?? 'gra',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      bucket_prefix_pieces_jointes: process.env.S3_BUCKET_PREFIX_PJ ?? 'pj/'
    },
    rateLimiter: {
      getDossierMilo: {
        limit: process.env.RATE_LIMITER_GET_DOSSIER_MILO_LIMIT ?? '10',
        interval: process.env.RATE_LIMITER_GET_DOSSIER_MILO_INTERVAL ?? '1500'
      }
    },
    mattermost: {
      jobWebhookUrl: process.env.MATTERMOST_JOBS_WEBHOOK_URL
    },
    task: process.env.TASK,
    jobs: {
      notificationRecherches: {
        nombreDeRequetesEnParallele:
          process.env.JOB_NOMBRE_RECHERCHES_PARALLELE ?? '5'
      },
      mailConseillers: {
        nombreDeConseillersEnParallele:
          process.env.JOB_NOMBRE_CONSEILLERS_PARALLELE ?? '100'
      }
    }
  }
  return Joi.attempt(configuration, configurationSchema)
}
