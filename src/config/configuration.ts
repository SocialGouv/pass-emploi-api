/* eslint-disable */
import { parse } from 'pg-connection-string'
import * as Joi from 'joi'
import { configurationSchema } from './configuration.schema'

export default () => {
  const scalingoApp = process.env.APP
  let baseUrl: string
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
    isInMemory: process.env.IS_IN_MEMORY === 'true',
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
    noReplyContactEmail:
      process.env.NO_REPLY_CONTACT_EMAIL ?? 'no-reply@pass-emploi.beta.gouv.fr',
    baseUrl,
    poleEmploi: {
      url:
        process.env.POLE_EMPLOI_API_BASE_URL ??
        'https://api.pole-emploi.io/partenaire',
      loginUrl:
        process.env.POLE_EMPLOI_LOGIN_URL ??
        'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token',
      clientId: process.env.POLE_EMPLOI_CLIENT_ID ?? '',
      clientSecret: process.env.POLE_EMPLOI_CLIENT_SECRET ?? '',
      scope: process.env.POLE_EMPLOI_SCOPE ?? ''
    },
    milo: {
      url: process.env.MILO_API_URL,
      apiKeyDossier: process.env.MILO_DOSSIER_API_KEY,
      apiKeyCreerJeune: process.env.MILO_JEUNE_API_KEY,
      apiKeyEvents: process.env.MILO_EVENTS_API_KEY,
      apiKeyDetailRendezVous: process.env.MILO_RENDEZ_VOUS_API_KEY,
      apiKeyInstanceSessionLecture:
        process.env.MILO_INSTANCE_SESSION_LECTURE_API_KEY,
      apiKeyInstanceSessionEcritureConseiller:
        process.env.MILO_INSTANCE_SESSION_ECRITURE_CONSEILLER_API_KEY,
      apiKeyInstanceSessionAnnulationJeune:
        process.env.MILO_INSTANCE_SESSION_ANNULATION_JEUNE_API_KEY,
      apiKeySessionDetailConseiller:
        process.env.MILO_SESSION_DETAIL_CONSEILLER_API_KEY,
      apiKeySessionsDetailEtListeJeune:
        process.env.MILO_SESSIONS_DETAIL_ET_LISTE_JEUNE_API_KEY,
      apiKeySessionsListeConseiller:
        process.env.MILO_SESSIONS_LISTE_CONSEILLER_API_KEY,
      apiKeyUtilisateurs: process.env.MILO_UTILISATEURS_API_KEY,
      urlWeb: process.env.MILO_WEB_URL
    },
    immersion: {
      url:
        process.env.IMMERSION_API_URL ??
        'https://immersion-facile.beta.gouv.fr/api',
      apiKey: process.env.IMMERSION_API_KEY ?? ''
    },
    diagoriente: {
      url:
        process.env.DIAGORIENTE_API_URL ??
        'https://api-dev.diagoriente.fr/graphql',
      clientId: process.env.DIAGORIENTE_CLIENT_ID ?? '',
      clientSecret: process.env.DIAGORIENTE_CLIENT_SECRET ?? ''
    },
    jecliqueoupas: {
      url: process.env.JECLIQUEOUPAS_API_URL,
      ip: process.env.JECLIQUEOUPAS_API_IP,
      token: process.env.JECLIQUEOUPAS_API_TOKEN,
      cert: process.env.JECLIQUEOUPAS_API_CERT,
      intervalleAnalyse: process.env.JECLIQUEOUPAS_API_INTERVALLE_ANALYSE || 15
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
      issuerUrl: process.env.OIDC_ISSUER_URL,
      issuerApiUrl: process.env.OIDC_ISSUER_API_URL,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      apiKey: process.env.OIDC_API_KEY
    },
    apiKeys: {
      keycloak: JSON.parse(process.env.API_KEY_KEYCLOAK!),
      immersion: JSON.parse(process.env.API_KEY_PARTENAIRE_IMMERSION!),
      poleEmploi: JSON.parse(process.env.API_KEY_CONSUMER_POLE_EMPLOI!),
      support: JSON.parse(process.env.API_KEY_SUPPORT!)
    },
    redis: {
      url: process.env.REDIS_URL
    },
    brevo: {
      url: process.env.SENDINBLUE_API_URL ?? 'https://api.sendinblue.com',
      apiKey: process.env.SENDINBLUE_API_KEY ?? '',
      templates: {
        conversationsNonLues:
          process.env.SENDINBLUE_CONVERSATIONS_TEMPLATE_ID ?? '2',
        conversationsNonLuesPassEmploi:
          process.env.SENDINBLUE_CONVERSATIONS_BRSA_TEMPLATE_ID ?? '363',
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
        compteJeuneArchiveMILO:
          process.env.SENDINBLUE_COMPTE_JEUNE_ARCHIVE_MILO_ID ?? '51',
        compteJeuneArchivePECEJ:
          process.env.SENDINBLUE_COMPTE_JEUNE_ARCHIVE_PE_CEJ_ID ?? '369',
        compteJeuneArchivePEBRSA:
          process.env.SENDINBLUE_COMPTE_JEUNE_ARCHIVE_PE_BRSA_ID ?? '386',
        creationConseillerMilo:
          process.env.BREVO_CREATION_CONSEILLER_MILO_ID ?? '264'
      },
      mailingLists: {
        poleEmploi: process.env.SENDINBLUE_POLE_EMPLOI_MAILING_LIST_ID ?? 7,
        milo: process.env.SENDINBLUE_MILO_MAILING_LIST_ID ?? 8,
        brsa: process.env.SENDINBLUE_BRSA_MAILING_LIST_ID ?? 56,
        aij: process.env.SENDINBLUE_AIJ_MAILING_LIST_ID ?? 55,
        cd: process.env.SENDINBLUE_CD_MAILING_LIST_ID ?? 59
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
      dossierMilo: {
        limit: process.env.RATE_LIMITER_DOSSIER_MILO_LIMIT ?? '3',
        interval: process.env.RATE_LIMITER_DOSSIER_MILO_INTERVAL ?? '1000'
      },
      evenementsMilo: {
        limit: process.env.RATE_LIMITER_EVENEMENTS_MILO_LIMIT ?? '3',
        interval: process.env.RATE_LIMITER_EVENEMENTS_MILO_INTERVAL ?? '1000'
      },
      dossierSessionRDVMilo: {
        limit: process.env.RATE_LIMITER_DOSSIER_SESSION_RDV_MILO_LIMIT ?? '3',
        interval:
          process.env.RATE_LIMITER_DOSSIER_SESSION_RDV_MILO_INTERVAL ?? '1000'
      },
      sessionsStructureMilo: {
        limit: process.env.RATE_LIMITER_SESSIONS_STRUCTURE_MILO_LIMIT ?? '3',
        interval:
          process.env.RATE_LIMITER_SESSIONS_STRUCTURE_MILO_INTERVAL ?? '1000'
      },
      sessionsConseillerMilo: {
        limit: process.env.RATE_LIMITER_SESSIONS_CONSEILLER_MILO_LIMIT ?? '3',
        interval:
          process.env.RATE_LIMITER_SESSIONS_CONSEILLER_MILO_INTERVAL ?? '1000'
      },
      sessionsJeuneMilo: {
        limit: process.env.RATE_LIMITER_SESSIONS_JEUNE_MILO_LIMIT ?? '3',
        interval:
          process.env.RATE_LIMITER_SESSIONS_JEUNE_MILO_INTERVAL ?? '1000'
      },
      structuresMilo: {
        limit: process.env.RATE_LIMITER_STRUCTURES_MILO_LIMIT ?? '3',
        interval: process.env.RATE_LIMITER_STRUCTURES_MILO_INTERVAL ?? '1000'
      },
      notificationsPE: {
        limit: process.env.RATE_LIMITER_NOTIFICATIONS_PE_LIMIT ?? '3',
        interval: process.env.RATE_LIMITER_NOTIFICATIONS_PE_INTERVAL ?? '1000'
      },
      matomo: {
        limit: process.env.RATE_LIMITER_MATOMO_LIMIT ?? '3',
        interval: process.env.RATE_LIMITER_MATOMO_INTERVAL ?? '1000'
      },
      evenementsEngagement: {
        limit: process.env.RATE_LIMITER_AE_LIMIT ?? '10',
        interval: process.env.RATE_LIMITER_AE_INTERVAL ?? '1200'
      },
      notifsCVM: {
        limit: process.env.RATE_LIMITER_NOTIFS_CVM_LIMIT ?? '50',
        interval: process.env.RATE_LIMITER_NOTIFS_CVM_INTERVAL ?? '1000'
      }
    },
    matomo: {
      siteId: process.env.MATOMO_SOCIALGOUV_SITE_ID,
      url: process.env.MATOMO_SOCIALGOUV_URL
    },
    mattermost: {
      jobWebhookUrl: process.env.MATTERMOST_JOBS_WEBHOOK_URL
    },
    monitoring: {
      dashboardUrl: process.env.MONITORING_DASHBOARD_URL
    },
    task: {
      name: process.env.TASK_NAME,
      date: process.env.TASK_DATE
    },
    jobs: {
      notificationRecherches: {
        nombreDeRequetesEnParallele:
          process.env.JOB_NOMBRE_RECHERCHES_PARALLELE ?? '5'
      },
      mailConseillers: {
        nombreDeConseillersEnParallele:
          process.env.JOB_NOMBRE_CONSEILLERS_PARALLELE ?? '100'
      }
    },
    version: process.env.npm_package_version ?? '0.0.0',
    features: {
      envoyerStatsMatomo: process.env.FEATURE_ENVOYER_STATS_MATOMO === 'true',
      rendezVousMilo: process.env.FEATURE_RDV_MILO === 'true',
      notifierRendezVousMilo: process.env.FEATURE_NOTIFIER_RDV_MILO === 'true',
      recupererStructureMilo:
        process.env.FEATURE_RECUPERER_STRUCTURE_MILO === 'true',
      recupererSessionsMilo:
        process.env.FEATURE_RECUPERER_SESSIONS_MILO === 'true'
    },
    values: {
      maxRechercheConseillers: process.env.MAX_RECHERCHE_CONSEILLERS ?? '10'
    },
    headers: {
      maxAge: process.env.CACHE_CONTROL_MAX_AGE_APP_MOBILE_EN_SECONDES
    },
    recherche: {
      seuil: process.env.THRESHOLD_SEARCH_MESSAGES
    }
  }
  return Joi.attempt(configuration, configurationSchema)
}
