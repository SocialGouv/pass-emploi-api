import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from '../utils/date-service'
import { RendezVous } from './rendez-vous'

export const PlanificateurRepositoryToken = 'PlanificateurRepositoryToken'

export namespace Planificateur {
  export interface Repository {
    createJob<T>(job: Job<T>, jobId?: string): Promise<void>

    createCron(cron: Cron): Promise<void>

    subscribe(callback: Handler<unknown>): Promise<void>

    supprimerTousLesJobs(): Promise<void>

    supprimerLesCrons(): Promise<void>

    supprimerLesAnciensJobs(): Promise<void>

    supprimerJobsSelonPattern(pattern: string): Promise<void>
  }

  export enum CronJob {
    NOUVELLES_OFFRES_EMPLOI = 'NOUVELLES_OFFRES_EMPLOI',
    MAIL_CONSEILLER_MESSAGES = 'MAIL_CONSEILLER_MESSAGES',
    UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS = 'UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS',
    NETTOYER_LES_JOBS = 'NETTOYER_LES_JOBS'
  }

  export enum JobEnum {
    RENDEZVOUS = 'RENDEZVOUS',
    FAKE = 'FAKE'
  }

  export interface JobRendezVous {
    idRendezVous: string
  }

  export interface JobFake {
    message: string
  }

  export type JobType = JobRendezVous | JobFake

  export interface Job<T = JobType> {
    date: Date
    type: JobEnum | CronJob
    contenu: T
  }

  export interface Cron {
    type: CronJob
    expression: string
  }

  export interface Handler<T> {
    (job: Job<T>): Promise<void>
  }
}

@Injectable()
export class PlanificateurService {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService
  ) {}

  async planifierCron(cronJob: Planificateur.CronJob): Promise<void> {
    switch (cronJob) {
      case Planificateur.CronJob.NOUVELLES_OFFRES_EMPLOI: {
        const cron: Planificateur.Cron = {
          type: Planificateur.CronJob.NOUVELLES_OFFRES_EMPLOI,
          expression: '0 9 * * *'
        }
        await this.planificateurRepository.createCron(cron)
        break
      }
      case Planificateur.CronJob.MAIL_CONSEILLER_MESSAGES: {
        const cron: Planificateur.Cron = {
          type: Planificateur.CronJob.MAIL_CONSEILLER_MESSAGES,
          expression: '0 8 * * 1-5'
        }
        await this.planificateurRepository.createCron(cron)
        break
      }
      case Planificateur.CronJob.NETTOYER_LES_JOBS: {
        const cron: Planificateur.Cron = {
          type: Planificateur.CronJob.NETTOYER_LES_JOBS,
          expression: '0 4 * * *'
        }
        await this.planificateurRepository.createCron(cron)
        break
      }
      case Planificateur.CronJob.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS: {
        const cron: Planificateur.Cron = {
          type: Planificateur.CronJob.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS,
          expression: '0 1 * * *'
        }
        await this.planificateurRepository.createCron(cron)
        break
      }
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

  async supprimerRappelsRendezVous(rendezVous: RendezVous): Promise<void> {
    await this.planificateurRepository.supprimerJobsSelonPattern(rendezVous.id)
  }

  private async creerJobRendezVous(
    rendezVous: RendezVous,
    days: number
  ): Promise<void> {
    const jobId = `rdv:${rendezVous.id}:${days}`
    const job: Planificateur.Job<Planificateur.JobRendezVous> = {
      date: DateTime.fromJSDate(rendezVous.date)
        .minus({ days: days })
        .toJSDate(),
      type: Planificateur.JobEnum.RENDEZVOUS,
      contenu: { idRendezVous: rendezVous.id }
    }
    await this.planificateurRepository.createJob(job, jobId)
  }
}
