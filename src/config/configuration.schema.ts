import * as Joi from 'joi'

export const configurationSchema = Joi.object({
  environment: Joi.string().default('development'),
  isWeb: Joi.boolean().required(),
  isWorker: Joi.boolean().required(),
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
  poleEmploiPartenaire: Joi.object({
    url: Joi.string().uri().required()
  }),
  milo: Joi.object({
    url: Joi.string().uri().required(),
    urlWeb: Joi.string()
      .uri()
      .description("feature flipping pour ajouter l'url du dossier du jeune"),
    apiKeyRecupererDossier: Joi.string().required(),
    apiKeyCreerJeune: Joi.string().required()
  }),
  immersion: {
    url: Joi.string().uri().required(),
    apiKey: Joi.string().required()
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
    keycloak: Joi.string().required(),
    immersion: Joi.string().required()
  }),
  redis: Joi.object({
    url: Joi.string().uri()
  }),
  sendinblue: Joi.object({
    url: Joi.string().uri().required(),
    apiKey: Joi.string().required(),
    templates: Joi.object({
      conversationsNonLues: Joi.number().required(),
      nouveauRendezvous: Joi.number().required(),
      rappelRendezvous: Joi.number().required(),
      rendezVousSupprime: Joi.number().required(),
      suppressionJeuneMilo: Joi.number().required(),
      suppressionJeunePE: Joi.number().required()
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
  task: Joi.string(),
  jobs: Joi.object({
    notificationRecherches: Joi.object({
      nombreDeRequetesEnParallele: Joi.number().required()
    }),
    mailConseillers: Joi.object({
      nombreDeConseillersEnParallele: Joi.number().required()
    })
  })
})
