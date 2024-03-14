import * as Joi from 'joi'

export const configurationSchema = Joi.object({
  environment: Joi.string().default('development'),
  isWeb: Joi.boolean().required(),
  isWorker: Joi.boolean().required(),
  isInMemory: Joi.boolean(),
  port: Joi.number().required(),
  database: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().required(),
    database: Joi.string().required(),
    user: Joi.string().required(),
    password: Joi.string().required(),
    acquireConnections: Joi.number().required(),
    evictConnections: Joi.number().required(),
    idleConnections: Joi.number().required(),
    maxConnections: Joi.number().required(),
    minConnections: Joi.number().required()
  }),
  debug: Joi.boolean().default(false),
  logLevel: Joi.string().default('INFO'),
  nodeEnv: Joi.string().required(),
  frontEndUrl: Joi.string().uri().required(),
  passEmploiContactEmail: Joi.string().email().required(),
  baseUrl: Joi.string().uri().required(),
  poleEmploi: Joi.object({
    url: Joi.string().uri().required(),
    loginUrl: Joi.string().uri().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required(),
    scope: Joi.string().required()
  }),
  milo: Joi.object({
    url: Joi.string().uri().required(),
    urlWeb: Joi.string()
      .uri()
      .description("feature flipping pour ajouter l'url du dossier du jeune"),
    apiKeyDossier: Joi.string().required(),
    apiKeyCreerJeune: Joi.string().required(),
    apiKeyEvents: Joi.string().required(),
    apiKeyDetailRendezVous: Joi.string().required(),
    apiKeyInstanceSessionLecture: Joi.string().required(),
    apiKeyInstanceSessionEcritureConseiller: Joi.string().required(),
    apiKeyInstanceSessionAnnulationJeune: Joi.string().required(),
    apiKeySessionDetailConseiller: Joi.string().required(),
    apiKeySessionsDetailEtListeJeune: Joi.string().required(),
    apiKeySessionsListeConseiller: Joi.string().required(),
    apiKeyUtilisateurs: Joi.string().required()
  }),
  immersion: {
    url: Joi.string().uri().required(),
    apiKey: Joi.string().required()
  },
  diagoriente: {
    url: Joi.string().uri().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required()
  },
  serviceCivique: {
    url: Joi.string().uri().required(),
    apiKey: Joi.string().required()
  },
  firebase: {
    key: Joi.string().required(),
    encryptionKey: Joi.string().required()
  },
  oidc: Joi.object({
    issuerUrl: Joi.string().uri().required(),
    issuerApiUrl: Joi.string().uri().required(),
    clientId: Joi.string().required(),
    clientSecret: Joi.string().required()
  }),
  apiKeys: Joi.object({
    keycloak: Joi.array().items(Joi.string().required()).min(1).required(),
    immersion: Joi.array().items(Joi.string().required()).min(1).required(),
    poleEmploi: Joi.array().items(Joi.string().required()).min(1).required()
  }),
  redis: Joi.object({
    url: Joi.string().uri()
  }),
  brevo: Joi.object({
    url: Joi.string().uri().required(),
    apiKey: Joi.string().required(),
    templates: Joi.object({
      conversationsNonLues: Joi.number().required(),
      creationConseillerMilo: Joi.number().required(),
      nouveauRendezvous: Joi.number().required(),
      rappelRendezvous: Joi.number().required(),
      rendezVousSupprime: Joi.number().required(),
      suppressionJeuneMilo: Joi.number().required(),
      suppressionJeunePE: Joi.number().required(),
      compteJeuneArchive: Joi.number().required()
    }),
    mailingLists: Joi.object({
      poleEmploi: Joi.number().required(),
      milo: Joi.number().required()
    })
  }),
  s3: Joi.object({
    endpoint: Joi.string().required(),
    region: Joi.string().required(),
    accessKeyId: Joi.string().required(),
    secretAccessKey: Joi.string().required(),
    bucket: Joi.string().required(),
    bucket_prefix_pieces_jointes: Joi.string().required()
  }),
  rateLimiter: Joi.object({
    dossierMilo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    evenementsMilo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    dossierSessionRDVMilo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    sessionsStructureMilo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    sessionsConseillerMilo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    sessionsJeuneMilo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    structuresMilo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    notificationsPE: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    matomo: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    evenementsEngagement: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    }),
    notifsCVM: Joi.object({
      limit: Joi.number().required(),
      interval: Joi.number().required()
    })
  }),
  matomo: Joi.object({
    siteId: Joi.number().required(),
    url: Joi.string().uri().required()
  }),
  mattermost: Joi.object({ jobWebhookUrl: Joi.string().uri().required() }),
  monitoring: Joi.object({ dashboardUrl: Joi.string().uri().required() }),
  task: Joi.object({
    name: Joi.string(),
    date: Joi.string().isoDate()
  }),
  jobs: Joi.object({
    notificationRecherches: Joi.object({
      nombreDeRequetesEnParallele: Joi.number().required()
    }),
    mailConseillers: Joi.object({
      nombreDeConseillersEnParallele: Joi.number().required()
    })
  }),
  version: Joi.string().required(),
  features: Joi.object({
    envoyerStatsMatomo: Joi.boolean(),
    rendezVousMilo: Joi.boolean(),
    notifierRendezVousMilo: Joi.boolean(),
    recupererStructureMilo: Joi.boolean(),
    recupererSessionsMilo: Joi.boolean()
  }),
  values: Joi.object({
    maxRechercheConseillers: Joi.number()
  }),
  headers: Joi.object({
    maxAge: Joi.number().required()
  })
})
