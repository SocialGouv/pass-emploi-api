import { Inject, Injectable } from '@nestjs/common'
import {
  Planificateur,
  PlanificateurRepositoryToken,
  PlanificateurService
} from '../../../domain/planificateur'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { emptySuccess, Result } from '../../../building-blocks/types/result'

@Injectable()
export class InitCronsCommandHandler extends CommandHandler<Command, void> {
  constructor(
    private planificateurService: PlanificateurService,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository
  ) {
    super('InitCronsCommandHandler')
  }

  async handle(): Promise<Result> {
    await this.planificateurRepository.supprimerLesCronJobs()
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.NOUVELLES_OFFRES_EMPLOI
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.NOUVELLES_OFFRES_SERVICE_CIVIQUE
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.MAIL_CONSEILLER_MESSAGES
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.NETTOYER_LES_JOBS
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.RECUPERER_SITUATIONS_JEUNES_MILO
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.NETTOYER_LES_PIECES_JOINTES
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.NETTOYER_LES_DONNEES
    )
    await this.planificateurService.planifierCronJob(
      Planificateur.JobType.NOTIFIER_RENDEZVOUS_PE
    )
    return emptySuccess()
  }

  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
