import { Inject } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { CampagneExisteDejaError } from '../../../building-blocks/types/domain-error'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { Campagne, CampagneRepositoryToken } from '../../../domain/campagne'
import { Core } from '../../../domain/core'
import { SupportAuthorizer } from '../../authorizers/support-authorizer'
import {
  Planificateur,
  PlanificateurRepositoryToken
} from '../../../domain/planificateur'
import { DateService } from '../../../utils/date-service'

export interface CreateCampagneCommand extends Command {
  nom: string
  dateDebut: DateTime
  dateFin: DateTime
}

export class CreateCampagneCommandHandler extends CommandHandler<
  CreateCampagneCommand,
  Core.Id
> {
  constructor(
    @Inject(CampagneRepositoryToken)
    private campagneRepository: Campagne.Repository,
    private campagneFactory: Campagne.Factory,
    private supportAuthorizer: SupportAuthorizer,
    @Inject(PlanificateurRepositoryToken)
    private planificateurRepository: Planificateur.Repository,
    private dateService: DateService
  ) {
    super('CreateCampagneCommandHandler')
  }

  async authorize(
    _command: CreateCampagneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.supportAuthorizer.autoriserSupport(utilisateur)
  }

  async handle(command: CreateCampagneCommand): Promise<Result<Core.Id>> {
    const campagneExistanteSurLIntervalleOuLeNom =
      await this.campagneRepository.getByIntervalOrName(
        command.dateDebut,
        command.dateFin,
        command.nom
      )

    if (campagneExistanteSurLIntervalleOuLeNom) {
      return failure(new CampagneExisteDejaError())
    }

    const campagne = this.campagneFactory.creer(command)
    await this.campagneRepository.save(campagne)

    const maintenant = this.dateService.now()

    await this.planificateurRepository.creerJob({
      dateExecution: maintenant
        .plus({ days: 1 })
        .set({ hour: 11, minute: 40, second: 0, millisecond: 0 })
        .toJSDate(),
      type: Planificateur.JobType.NOTIFIER_CAMPAGNE,
      contenu: {
        offset: 0,
        idCampagne: campagne.id,
        nbNotifsEnvoyees: 0
      }
    })

    if (command.dateFin.diff(this.dateService.now()).as('days') > 7) {
      await this.planificateurRepository.creerJob({
        dateExecution: maintenant
          .plus({ days: 7 })
          .set({ hour: 11, minute: 40, second: 0, millisecond: 0 })
          .toJSDate(),
        type: Planificateur.JobType.NOTIFIER_CAMPAGNE,
        contenu: {
          offset: 0,
          idCampagne: campagne.id,
          nbNotifsEnvoyees: 0
        }
      })
    }

    return success({ id: campagne.id })
  }

  async monitor(): Promise<void> {
    return
  }
}
