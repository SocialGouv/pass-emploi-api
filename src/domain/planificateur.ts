import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { RendezVous } from './rendez-vous'

export const PlanificateurRepositoryToken = 'PlanificateurRepositoryToken'

export namespace Planificateur {
  export interface Repository {
    createJob(job: Job): Promise<void>
  }

  export enum JobType {
    RENDEZVOUS = 'RENDEZVOUS'
  }

  interface JobRendezVous {
    idRendezVous: string
  }
  export interface Job {
    date: Date
    type: JobType
    contenu: JobRendezVous
  }
}

@Injectable()
export class PlanificateurService {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {}

  async planifierRendezVous(rendezVous: RendezVous): Promise<void> {
    const job: Planificateur.Job = {
      date: DateTime.fromJSDate(rendezVous.date).minus({ days: 1 }).toJSDate(),
      type: Planificateur.JobType.RENDEZVOUS,
      contenu: { idRendezVous: rendezVous.id }
    }

    await this.planificateurRepository.createJob(job)
  }
}
