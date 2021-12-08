/* eslint-disable */
import { parse } from 'pg-connection-string'

export default () => {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://passemploi:passemploi@localhost:55432/passemploidb'
  const { host, port, database, user, password } = parse(databaseUrl)
  return {
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
    firebase: {
      environmentPrefix: process.env.FIREBASE_ENVIRONMENT_PREFIX ?? 'staging',
      key: process.env.FIREBASE_SECRET_KEY ?? ''
    },
    oidc: {
      issuerUrl: process.env.OIDC_ISSUER_URL ?? ''
    },
    apiKeys: {
      keycloak: process.env.API_KEY_KEYCLOAK ?? 'ceci-est-une-api-key'
    }
  }
}
