import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from '../utils/date-service'
import { Action } from './action/action'
import { RendezVous } from './rendez-vous/rendez-vous'
import { NettoyageJobsStats } from './suivi-job'
import { MiloRendezVous } from './partenaire/milo/milo.rendez-vous'

export const PlanificateurRepositoryToken = 'PlanificateurRepositoryToken'

export namespace Planificateur {
  export interface Repository {
    creerJob<T>(job: Job<T>, jobId?: string, params?: JobParams): Promise<void>

    creerCronJob(cronJob: CronJob): Promise<void>

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
    MAJ_AGENCE_AC = 'MAJ_AGENCE_AC',
    MONITORER_JOBS = 'MONITORER_JOBS',
    GENERER_JDD = 'GENERER_JDD',
    SUIVRE_EVENEMENTS_MILO = 'SUIVRE_EVENEMENTS_MILO',
    TRAITER_EVENEMENT_MILO = 'TRAITER_EVENEMENT_MILO'
  }

  export interface JobRendezVous {
    idRendezVous: string
  }

  export interface JobRappelAction {
    idAction: string
  }

  export interface JobGenererJDD {
    idConseiller: string
    menage: boolean
  }

  export type JobTraiterEvenementMilo = MiloRendezVous.Evenement

  export interface JobFake {
    message: string
  }

  export type ContenuJob = JobRendezVous | JobFake

  export interface Job<T = ContenuJob> {
    dateExecution: Date
    type: JobType
    contenu: T
  }

  export interface CronJob {
    type: JobType
    expression: string
    dateDebutExecution?: Date
  }

  export interface Handler<T> {
    (job: Job<T>): Promise<void>
  }
}

export const listeCronJobs: Planificateur.CronJob[] = [
  {
    type: Planificateur.JobType.SUIVRE_EVENEMENTS_MILO,
    expression: '*/15 * * * *'
  },
  {
    type: Planificateur.JobType.RECUPERER_SITUATIONS_JEUNES_MILO,
    expression: '0 0 * * *'
  },
  {
    type: Planificateur.JobType.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS,
    expression: '0 1 * * *'
  },
  {
    type: Planificateur.JobType.NETTOYER_LES_PIECES_JOINTES,
    expression: '0 2 * * *',
    dateDebutExecution: new Date('2022-10-01')
  },
  {
    type: Planificateur.JobType.NETTOYER_LES_JOBS,
    expression: '0 4 * * *'
  },
  {
    type: Planificateur.JobType.NETTOYER_LES_DONNEES,
    expression: '0 5 * * *'
  },
  {
    type: Planificateur.JobType.MAIL_CONSEILLER_MESSAGES,
    expression: '0 8 * * 1-5'
  },
  {
    type: Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI,
    expression: '0 9 * * *'
  },
  {
    type: Planificateur.JobType.NOUVELLES_OFFRES_SERVICE_CIVIQUE,
    expression: '0 11 * * *'
  },
  {
    type: Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE,
    expression: '0 */2 * * *'
  },
  {
    type: Planificateur.JobType.MAJ_AGENCE_AC,
    expression: '0 3 * * *'
  },
  {
    type: Planificateur.JobType.MONITORER_JOBS,
    expression: '45 9 * * *'
  },
  {
    type: Planificateur.JobType.MAJ_SEGMENTS,
    expression: '0 6 * * *'
  }
]

@Injectable()
export class PlanificateurService {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService
  ) {}

  async planifierLesCronJobs(): Promise<void> {
    for (const cronJob of listeCronJobs) {
      await this.planificateurRepository.creerCronJob(cronJob)
    }
  }

  async planifierRappelsRendezVous(rendezVous: RendezVous): Promise<void> {
    const now = this.dateService.now()

    const nombreDeJoursAvantLeRdv: number = DateTime.fromJSDate(rendezVous.date)
      .diff(now)
      .as('days')

    if (nombreDeJoursAvantLeRdv > 7) {
      await this.creerJobRendezVous(rendezVous, 7)
    }

    if (nombreDeJoursAvantLeRdv > 1) {
      await this.creerJobRendezVous(rendezVous, 1)
    }
  }

  async planifierRappelAction(action: Action): Promise<void> {
    await this.creerJobRappelAction(action, 3)
  }

  async supprimerRappelsParId(id: string): Promise<void> {
    await this.planificateurRepository.supprimerLesJobsSelonPattern(id)
  }

  async creerJobEvenementMiloSiIlNaPasEteCreeAvant(
    evenementMilo: MiloRendezVous.Evenement
  ): Promise<void> {
    const jobId = `event-milo:${evenementMilo.id}`

    const job: Planificateur.Job<Planificateur.JobTraiterEvenementMilo> = {
      type: Planificateur.JobType.TRAITER_EVENEMENT_MILO,
      contenu: evenementMilo,
      dateExecution: this.dateService.now().toJSDate()
    }
    // Si on créée un job avec un id qui existe déjà, il ne se passe rien
    await this.planificateurRepository.creerJob(job, jobId, {
      priority: 2,
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 5 * 60 * 1000
      }
    })
  }

  private async creerJobRendezVous(
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
    await this.planificateurRepository.creerJob(job, jobId)
  }

  private async creerJobRappelAction(
    action: Action,
    days: number
  ): Promise<void> {
    const jobId = `action:${action.id}:${days}`

    const job: Planificateur.Job<Planificateur.JobRappelAction> = {
      dateExecution: action.dateEcheance.minus({ days: days }).toJSDate(),
      type: Planificateur.JobType.RAPPEL_ACTION,
      contenu: { idAction: action.id }
    }
    await this.planificateurRepository.creerJob(job, jobId)
  }
}
