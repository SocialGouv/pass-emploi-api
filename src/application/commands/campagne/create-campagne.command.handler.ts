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
    const heure = maintenant.hour
    const jour = maintenant.weekday

    const jeudi = 4
    const heureDExecution = 11
    const heureMinuteExecution = {
      hour: heureDExecution,
      minute: 40,
      second: 0,
      millisecond: 0
    }
    let dateExecution = maintenant
      .plus({ days: 1 })
      .setZone('Europe/Paris')
      .set(heureMinuteExecution)

    if (heure <= heureDExecution && jour !== jeudi) {
      dateExecution = maintenant
        .setZone('Europe/Paris')
        .set(heureMinuteExecution)
    }

    await this.planificateurRepository.ajouterJob({
      dateExecution: dateExecution.toJSDate(),
      type: Planificateur.JobType.NOTIFIER_CAMPAGNE,
      contenu: {
        offset: 0,
        idCampagne: campagne.id,
        nbNotifsEnvoyees: 0
      }
    })

    if (command.dateFin.diff(this.dateService.now()).as('days') > 7) {
      let rappel = maintenant.plus({ days: 7 }).setZone('Europe/Paris')
      if (rappel.weekday === jeudi) {
        rappel = maintenant.plus({ days: 8 }).setZone('Europe/Paris')
      }
      await this.planificateurRepository.ajouterJob({
        dateExecution: rappel.set(heureMinuteExecution).toJSDate(),
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
