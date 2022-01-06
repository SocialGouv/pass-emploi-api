/* eslint-disable */
import { parse } from 'pg-connection-string'

export default () => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://passemploi:passemploi@localhost:55432/passemploidb'
  const { host, port, database, user, password } = parse(databaseUrl)
  return {
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
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
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
    firebase: {
      key: process.env.FIREBASE_SECRET_KEY ?? '',
      encryptionKey: process.env.CHAT_ENCRYPTION_KEY
    },
    oidc: {
      issuerUrl: process.env.OIDC_ISSUER_URL ?? ''
    },
    apiKeys: {
      keycloak: process.env.API_KEY_KEYCLOAK ?? 'ceci-est-une-api-key'
    },
    redis: {
      url: process.env.REDIS_URL ?? ''
    },
    matomo: {
      url:
        process.env.MATOMO_API_URL ?? 'https://stats.data.gouv.fr/matomo.php',
      envId: process.env.MATOMO_ENV_ID ?? '209'
    }
  }
}
