import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common'
import * as APM from 'elastic-apm-node'
import { DateTime } from 'luxon'
import { getAPMInstance } from 'src/infrastructure/monitoring/apm.init'
import { DateService } from '../utils/date-service'
import { buildError } from '../utils/logger.module'
import { Action } from './action/action'
import { EvenementMilo } from './milo/evenement.milo'
import { RendezVous } from './rendez-vous/rendez-vous'
import { NettoyageJobsStats } from './suivi-job'
import { Notification } from './notification/notification'
import { Core } from './core'

export const PlanificateurRepositoryToken = 'PlanificateurRepositoryToken'

export interface InstanceSessionRappel {
  idInstance: string
  idDossier: string
  idSession: string
  dateDebut: DateTime
}

export namespace Planificateur {
  export interface Repository {
    ajouterJob<T>(
      job: Job<T>,
      jobId?: string,
      params?: JobParams
    ): Promise<void>

    ajouterCronJob(cronJob: CronJob): Promise<void>

    subscribe(callback: Handler<unknown>): Promise<void>

    supprimerLesJobs(): Promise<void>

    supprimerLesCronJobs(): Promise<void>

    supprimerLesJobsPasses(): Promise<NettoyageJobsStats>

    supprimerLesJobsSelonPattern(pattern: string): Promise<void>

    estEnCours(jobType: Planificateur.JobType): Promise<boolean>
  }

  export interface JobParams {
    priority?: number
    attempts?: number
    backoff?: {
      type?: 'fixed' | 'exponential'
      delay?: number
    }
  }

  export enum JobType {
    RENDEZVOUS = 'RENDEZVOUS',
    RAPPEL_SESSION = 'RAPPEL_SESSION',
    RAPPEL_ACTION = 'RAPPEL_ACTION',
    FAKE = 'FAKE',
    NOUVELLES_OFFRES_EMPLOI = 'NOUVELLES_OFFRES_EMPLOI',
    NOUVELLES_OFFRES_SERVICE_CIVIQUE = 'NOUVELLES_OFFRES_SERVICE_CIVIQUE',
    MAIL_CONSEILLER_MESSAGES = 'MAIL_CONSEILLER_MESSAGES',
    UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS = 'UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS',
    RECUPERER_SITUATIONS_JEUNES_MILO = 'RECUPERER_SITUATIONS_JEUNES_MILO',
    NETTOYER_LES_JOBS = 'NETTOYER_LES_JOBS',
    NETTOYER_LES_PIECES_JOINTES = 'NETTOYER_LES_PIECES_JOINTES',
    NETTOYER_LES_DONNEES = 'NETTOYER_LES_DONNEES',
    NOTIFIER_RENDEZVOUS_PE = 'NOTIFIER_RENDEZVOUS_PE',
    MAJ_CODES_EVENEMENTS = 'MAJ_CODES_EVENEMENTS',
    MAJ_SEGMENTS = 'MAJ_SEGMENTS',
    MONITORER_JOBS = 'MONITORER_JOBS',
    GENERER_JDD = 'GENERER_JDD',
    SUIVRE_FILE_EVENEMENTS_MILO = 'SUIVRE_FILE_EVENEMENTS_MILO',
    TRAITER_EVENEMENT_MILO = 'TRAITER_EVENEMENT_MILO',
    DUMP_ANALYTICS = 'DUMP_ANALYTICS',
    CHARGER_EVENEMENTS_ANALYTICS = 'CHARGER_EVENEMENTS_ANALYTICS',
    NETTOYER_EVENEMENTS_CHARGES_ANALYTICS = 'NETTOYER_EVENEMENTS_CHARGES_ANALYTICS',
    ENRICHIR_EVENEMENTS_ANALYTICS = 'ENRICHIR_EVENEMENTS_ANALYTICS',
    CHARGER_LES_VUES_ANALYTICS = 'CHARGER_LES_VUES_ANALYTICS',
    INITIALISER_LES_VUES = 'INITIALISER_LES_VUES',
    CREER_TABLES_AE_ANNUELLES_ANALYTICS = 'CREER_TABLES_AE_ANNUELLES_ANALYTICS',
    CREER_VUE_AE_MENSUELLE = 'CREER_VUE_AE_MENSUELLE',
    QUALIFIER_ACTIONS = 'QUALIFIER_ACTIONS',
    RECUPERER_ANALYSE_ANTIVIRUS = 'RECUPERER_ANALYSE_ANTIVIRUS',
    NOTIFIER_RAPPEL_CREATION_ACTIONS_DEMARCHES = 'NOTIFIER_RAPPEL_CREATION_ACTIONS_DEMARCHES',
    NOTIFIER_0_HEURES_DECLAREES = 'NOTIFIER_0_HEURES_DECLAREES',
    NOTIFIER_BONNE_ALTERNANCE = 'NOTIFIER_BONNE_ALTERNANCE',
    NOTIFIER_CAMPAGNE = 'NOTIFIER_CAMPAGNE',
    NOTIFIER_ACTUALISATION = 'NOTIFIER_ACTUALISATION',
    CLORE_SESSIONS = 'CLORE_SESSIONS',
    NOTIFIER_BENEFICIAIRES = 'NOTIFIER_BENEFICIAIRES'
  }

  export interface JobRendezVous {
    idRendezVous: string
  }

  export interface JobRappelSession {
    idInstance: string
    idDossier: string
    idSession: string
  }

  export type JobCloreSessions = {
    dateCloture: Date
    idsSessions: string[]
    idStructureMilo: string
  }

  export interface JobRappelCreationActionsDemarches {
    offset?: number
    nbJeunesNotifies?: number
  }

  export interface Job0HeuresDeclarees {
    offset?: number
    nbJeunesNotifies?: number
  }

  export interface JobNotifierParGroupe {
    offset: number
    nbPersonnesNotifiees: number
  }

  export interface JobRappelAction {
    idAction: string
  }

  export interface JobGenererJDD {
    idConseiller: string
    menage: boolean
  }

  export type JobRecupererAnalyseAntivirus = {
    idFichier: string
  }

  export type JobTraiterEvenementMilo = EvenementMilo

  export interface JobNotifierBeneficiaires {
    type: Notification.Type
    titre: string
    description: string
    structures: Core.Structure[]
    push: boolean
    batchSize?: number
    minutesEntreLesBatchs?: number
    offset?: number
    nbBeneficiairesNotifies?: number
  }

  export interface JobFake {
    message: string
  }

  export type ContenuJob = JobRendezVous | JobRappelSession | JobFake

  export interface Job<T = ContenuJob> {
    dateExecution: Date
    type: JobType
    contenu: T
  }

  export interface CronJob {
    type: JobType
    expression: string
    description?: string
    dateDebutExecution?: Date
  }

  export interface Handler<T> {
    (job: Job<T>): Promise<void>
  }
}

export const listeCronJobs: Planificateur.CronJob[] = [
  {
    type: Planificateur.JobType.NOTIFIER_ACTUALISATION,
    expression: '0 8 7 * *',
    description: 'Tous les 7 du mois à 8h.'
  },
  {
    type: Planificateur.JobType.SUIVRE_FILE_EVENEMENTS_MILO,
    expression: '*/15 * * * *',
    description: 'Toutes les 15 minutes.'
  },
  {
    type: Planificateur.JobType.RECUPERER_SITUATIONS_JEUNES_MILO,
    expression: '0 22 * * *',
    description: 'Tous les jours à 22h.'
  },
  {
    type: Planificateur.JobType.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS,
    expression: '0 1 * * *',
    description: 'Tous les jours à 1h.'
  },
  {
    type: Planificateur.JobType.NETTOYER_LES_PIECES_JOINTES,
    expression: '0 2 * * *',
    dateDebutExecution: new Date('2022-10-01'),
    description: 'Tous les jours à 2h.'
  },
  {
    type: Planificateur.JobType.NETTOYER_LES_JOBS,
    expression: '0 4 * * *',
    description: 'Tous les jours à 4h. Supprime les jobs passés.'
  },
  {
    type: Planificateur.JobType.NETTOYER_LES_DONNEES,
    expression: '0 5 * * *',
    description:
      "Tous les jours à 5h. Supprime les archives, les logs et les évènements d'engagement hebdo."
  },
  {
    type: Planificateur.JobType.QUALIFIER_ACTIONS,
    expression: '0 6 * * *',
    description:
      'Tous les jours à 6h. Qualifie en NON SNP les actions EN COURS il y a plus de 4 mois.'
  },
  {
    type: Planificateur.JobType.MAIL_CONSEILLER_MESSAGES,
    expression: '0 8 * * 1-5',
    description: 'Du lundi au vendredi à 8h.'
  },
  {
    type: Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI,
    expression: '0 9 * * *',
    description: 'Tous les jours à 9h.'
  },
  {
    type: Planificateur.JobType.NOTIFIER_RAPPEL_CREATION_ACTIONS_DEMARCHES,
    expression: '0 10 * * 4',
    description: 'Tous les jeudi à 10h.'
  },
  {
    type: Planificateur.JobType.NOTIFIER_0_HEURES_DECLAREES,
    expression: '0 16 * * 1',
    description: 'Tous les lundi à 16h.'
  },
  {
    type: Planificateur.JobType.NOUVELLES_OFFRES_SERVICE_CIVIQUE,
    expression: '0 11 * * *',
    description: 'Tous les jours à 11h.'
  },
  {
    type: Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE,
    expression: '0 */2 * * *',
    description: 'Toutes les 2 heures.'
  },
  {
    type: Planificateur.JobType.MONITORER_JOBS,
    expression: '45 9 * * *',
    description: 'Tous les jours à 9h45.'
  },
  {
    type: Planificateur.JobType.MAJ_SEGMENTS,
    expression: '0 6 * * *',
    description:
      "Tous les jours à 6h. MAJ Segments d'utilisateurs sur Firebase."
  },
  {
    type: Planificateur.JobType.DUMP_ANALYTICS,
    expression: '30 2 * * *',
    description: 'Tous les jours à 2h30. Dump de la DB vers analytics.'
  }
]

@Injectable()
export class PlanificateurService {
  private readonly apmService: APM.Agent

  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService
  ) {
    this.apmService = getAPMInstance()
  }

  async planifierLesCronJobs(): Promise<void> {
    for (const cronJob of listeCronJobs) {
      await this.planificateurRepository.ajouterCronJob(cronJob)
    }
  }

  async planifierRappelsRendezVous(rendezVous: RendezVous): Promise<void> {
    const now = this.dateService.now()

    const nombreDeJoursAvantLeRdv: number = DateTime.fromJSDate(rendezVous.date)
      .diff(now)
      .as('days')

    if (nombreDeJoursAvantLeRdv > 7) {
      await this.ajouterJobRendezVous(rendezVous, 7)
    }

    if (nombreDeJoursAvantLeRdv > 1) {
      await this.ajouterJobRendezVous(rendezVous, 1)
    }
  }

  async planifierRappelsInstanceSessionMilo(
    rappel: InstanceSessionRappel
  ): Promise<void> {
    const now = this.dateService.now()

    const nombreDeJoursAvantLeRdv: number = rappel.dateDebut
      .diff(now)
      .as('days')

    if (nombreDeJoursAvantLeRdv > 7) {
      await this.ajouterJobSession(rappel, 7)
    }

    if (nombreDeJoursAvantLeRdv > 1) {
      await this.ajouterJobSession(rappel, 1)
    }
  }

  async planifierRappelAction(action: Action): Promise<void> {
    await this.ajouterJobRappelAction(action, 3)
  }

  async supprimerRappelsParId(id: string): Promise<void> {
    await this.planificateurRepository.supprimerLesJobsSelonPattern(id)
  }

  async ajouterJobEvenementMiloSiIlNaPasEteCreeAvant(
    evenementMilo: EvenementMilo
  ): Promise<void> {
    const jobId = `event-milo:${evenementMilo.id}`

    const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
      type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
      contenu: evenementMilo,
      dateExecution: this.dateService.now().toJSDate()
    }
    // Si on créée un job avec un id qui existe déjà, il ne se passe rien
    await this.planificateurRepository.ajouterJob(job, jobId, {
      priority: 2,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5 * 60 * 1000
      }
    })
  }

  async ajouterJobClotureSessions(
    idsSessionsAClore: string[],
    idStructureMilo: string,
    dateCloture: DateTime,
    logger: LoggerService
  ): Promise<void> {
    const maintenant = this.dateService.nowJs()

    try {
      const job: Planificateur.Job<Planificateur.JobCloreSessions> = {
        dateExecution: maintenant,
        type: Planificateur.JobType.CLORE_SESSIONS,
        contenu: {
          dateCloture: dateCloture.toJSDate(),
          idsSessions: idsSessionsAClore,
          idStructureMilo
        }
      }
      await this.planificateurRepository.ajouterJob(job)
    } catch (e) {
      logger.error(
        buildError(
          `La cloture des sessions de la structure ${idStructureMilo} a échoué`,
          e
        )
      )
      this.apmService.captureError(e)
    }
  }

  private async ajouterJobRendezVous(
    rendezVous: RendezVous,
    days: number
  ): Promise<void> {
    const jobId = `rdv:${rendezVous.id}:${days}`
    const job: Planificateur.Job<Planificateur.JobRendezVous> = {
      dateExecution: DateTime.fromJSDate(rendezVous.date)
        .minus({ days: days })
        .toJSDate(),
      type: Planificateur.JobType.RENDEZVOUS,
      contenu: { idRendezVous: rendezVous.id }
    }
    await this.planificateurRepository.ajouterJob(job, jobId)
  }

  private async ajouterJobSession(
    rappel: InstanceSessionRappel,
    days: number
  ): Promise<void> {
    const jobId = `instance-session:${rappel.idInstance}:${days}`
    const job: Planificateur.Job<Planificateur.JobRappelSession> = {
      dateExecution: DateTime.fromJSDate(rappel.dateDebut.toJSDate())
        .minus({ days: days })
        .toJSDate(),
      type: Planificateur.JobType.RAPPEL_SESSION,
      contenu: rappel
    }
    await this.planificateurRepository.ajouterJob(job, jobId)
  }

  private async ajouterJobRappelAction(
    action: Action,
    days: number
  ): Promise<void> {
    const jobId = `action:${action.id}:${days}`

    const job: Planificateur.Job<Planificateur.JobRappelAction> = {
      dateExecution: action.dateEcheance.minus({ days: days }).toJSDate(),
      type: Planificateur.JobType.RAPPEL_ACTION,
      contenu: { idAction: action.id }
    }
    await this.planificateurRepository.ajouterJob(job, jobId)
  }
}

export function ProcessJobType(type: Planificateur.JobType): ClassDecorator {
  return function (target) {
    Reflect.defineMetadata('jobType', type, target)
  }
}

// TODO refactorer tout ça 👇 ça devrait être des méthodes publiques de planificateurService
export async function planifierRappelsInstanceSessionMilo(
  rappel: InstanceSessionRappel,
  planificateurService: PlanificateurService,
  logger: Logger,
  apmService: APM.Agent
): Promise<void> {
  try {
    await planificateurService.planifierRappelsInstanceSessionMilo(rappel)
  } catch (e) {
    logger.error(
      buildError(
        `La planification des notifications de l'instance de session Milo ${rappel.idInstance} a échoué`,
        e
      )
    )
    apmService.captureError(e)
  }
}

export async function supprimerRappelsInstanceSessionMilo(
  idInstanceSessionMilo: string,
  planificateurService: PlanificateurService,
  logger: Logger,
  apmService: APM.Agent
): Promise<void> {
  try {
    await planificateurService.supprimerRappelsParId(
      `instance-session:${idInstanceSessionMilo}`
    )
  } catch (e) {
    logger.error(
      buildError(
        `La suppression des notifications de l'instance de session ${idInstanceSessionMilo} a échoué`,
        e
      )
    )
    apmService.captureError(e)
  }
}

export async function planifierLesRappelsDeRendezVous(
  rendezVous: RendezVous,
  planificateurService: PlanificateurService,
  logger: Logger,
  apmService: APM.Agent
): Promise<void> {
  try {
    await planificateurService.planifierRappelsRendezVous(rendezVous)
  } catch (e) {
    logger.error(
      buildError(
        `La planification des notifications du rendez-vous ${rendezVous.id} a échoué`,
        e
      )
    )
    apmService.captureError(e)
  }
}

export async function supprimerLesRappelsDeRendezVous(
  idRendezVous: string,
  planificateurService: PlanificateurService,
  logger: Logger,
  apmService: APM.Agent
): Promise<void> {
  try {
    await planificateurService.supprimerRappelsParId(idRendezVous)
  } catch (e) {
    logger.error(
      buildError(
        `La suppression des notifications du rendez-vous ${idRendezVous} a échoué`,
        e
      )
    )
    apmService.captureError(e)
  }
}

export async function replanifierLesRappelsDeRendezVous(
  rendezVousUpdated: RendezVous,
  rendezVous: RendezVous,
  planificateurService: PlanificateurService,
  logger: Logger,
  apmService: APM.Agent
): Promise<void> {
  const laDateAEteModifiee =
    rendezVousUpdated.date.getTime() !== rendezVous.date.getTime()
  if (laDateAEteModifiee) {
    try {
      await planificateurService.supprimerRappelsParId(rendezVousUpdated.id)
      await planificateurService.planifierRappelsRendezVous(rendezVousUpdated)
    } catch (e) {
      logger.error(
        buildError(
          `La replanification des notifications du rendez-vous ${rendezVousUpdated.id} a échoué`,
          e
        )
      )
      apmService.captureError(e)
    }
  }
}
