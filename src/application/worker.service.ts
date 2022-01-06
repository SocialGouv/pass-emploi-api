import { Inject, Injectable } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../domain/planificateur'
import { HandleJobRendezVousCommandHandler } from './commands/handle-job-rendez-vous.command'

@Injectable()
export class WorkerService {
  constructor(
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private handlerJobRendezVousCommandHandler: HandleJobRendezVousCommandHandler
  ) {}

  subscribe(): void {
    this.planificateurRepository.subscribe(this.handler.bind(this))
  }

  async handler(job: Planificateur.Job): Promise<void> {
    await this.handlerJobRendezVousCommandHandler.execute({ job })
  }
}
