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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(_command: Command): Promise<Result> {
    await this.planificateurRepository.supprimerLesCrons()
    await this.planificateurService.planifierCron(
      Planificateur.CronJob.NOUVELLES_OFFRES_EMPLOI
    )
    await this.planificateurService.planifierCron(
      Planificateur.CronJob.NOUVELLES_OFFRES_SERVICE_CIVIQUE
    )
    await this.planificateurService.planifierCron(
      Planificateur.CronJob.MAIL_CONSEILLER_MESSAGES
    )
    await this.planificateurService.planifierCron(
      Planificateur.CronJob.NETTOYER_LES_JOBS
    )
    await this.planificateurService.planifierCron(
      Planificateur.CronJob.UPDATE_CONTACTS_CONSEILLER_MAILING_LISTS
    )
    await this.planificateurService.planifierCron(
      Planificateur.CronJob.RECUPERER_SITUATIONS_JEUNES_MILO
    )
    return emptySuccess()
  }

  async authorize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _command: Command
  ): Promise<void> {
    return
  }

  async monitor(): Promise<void> {
    return
  }
}
