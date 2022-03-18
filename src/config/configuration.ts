/* eslint-disable */
import { parse } from 'pg-connection-string'

export default () => {
  const scalingoApp = process.env.APP
  let baseUrl = ''
  if (scalingoApp && scalingoApp.startsWith('pa-back-staging-pr')) {
    baseUrl = `https://${scalingoApp}.osc-fr1.scalingo.io`
  } else {
    baseUrl = process.env.BASE_URL || 'http://localhost:5000'
  }

  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://passemploi:passemploi@localhost:55432/passemploidb'
  const { host, port, database, user, password } = parse(databaseUrl)
  return {
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
    nodeEnv: process.env.NODE_ENV || 'production',
    frontEndUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
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
      url:
        process.env.POLE_EMPLOI_PARTENAIRE_API_BASE_URL ??
        'https://api-r.es-qvr.fr/partenaire'
    },
    milo: {
      url: process.env.MILO_API_URL,
      apiKeyRecupererDossier: process.env.MILO_DOSSIER_API_KEY,
      apiKeyCreerJeune: process.env.MILO_JEUNE_API_KEY
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
      issuerUrl: process.env.OIDC_ISSUER_URL ?? ''
    },
    apiKeys: {
      keycloak: process.env.API_KEY_KEYCLOAK ?? 'ceci-est-une-api-key',
      immersion:
        process.env.API_KEY_PARTENAIRE_IMMERSION ?? 'ceci-est-une-autre-api-key'
    },
    redis: {
      url: process.env.REDIS_URL ?? ''
    },
    sendinblue: {
      url: process.env.SENDINBLUE_API_URL ?? 'https://api.sendinblue.com',
      apiKey: process.env.SENDINBLUE_API_KEY ?? '',
      templateId: process.env.SENDINBLUE_TEMPLATE_ID ?? '2'
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
}
