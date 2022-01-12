import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from '../utils/date-service'
import { RendezVous } from './rendez-vous'

export const PlanificateurRepositoryToken = 'PlanificateurRepositoryToken'

export namespace Planificateur {
  export interface Repository {
    createJob<T>(job: Job<T>): Promise<void>
    subscribe(callback: Handler<unknown>): Promise<void>
    supprimerTousLesJobs(): Promise<void>
  }

  export enum JobType {
    RENDEZVOUS = 'RENDEZVOUS',
    MAIL_CONSEILLER = 'MAIL_CONSEILLER'
  }

  export interface JobRendezVous {
    idRendezVous: string
  }

  export interface JobMailConseiller {
    idConseiller: string
  }

  export interface Job<T> {
    date: Date
    type: JobType
    contenu: T
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

  async planifierJobRappelMail(idConseiller: string): Promise<void> {
    const job: Planificateur.Job<Planificateur.JobMailConseiller> = {
      date: this.dateService
        .now()
        .toUTC()
        .set({ hour: 6, minute: 0, second: 0, millisecond: 0 })
        .plus({ days: 1 })
        .toJSDate(),
      type: Planificateur.JobType.MAIL_CONSEILLER,
      contenu: { idConseiller }
    }
    await this.planificateurRepository.createJob(job)
  }

  private async creerJobRendezVous(
    rendezVous: RendezVous,
    days: number
  ): Promise<void> {
    const job: Planificateur.Job<Planificateur.JobRendezVous> = {
      date: DateTime.fromJSDate(rendezVous.date)
        .minus({ days: days })
        .toJSDate(),
      type: Planificateur.JobType.RENDEZVOUS,
      contenu: { idRendezVous: rendezVous.id }
    }
    await this.planificateurRepository.createJob(job)
  }
}
