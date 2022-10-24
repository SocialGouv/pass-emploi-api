import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../building-blocks/types/result'
import { Action, ActionsRepositoryToken } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'
import { PlanificateurService } from '../../domain/planificateur'
import { buildError } from '../../utils/logger.module'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface CreateActionCommand extends Command {
  idJeune: Jeune.Id
  contenu: string
  idCreateur: Action.IdCreateur
  typeCreateur: Action.TypeCreateur
  statut?: Action.Statut
  commentaire?: string
  dateEcheance: DateTime
  rappel?: boolean
}

@Injectable()
export class CreateActionCommandHandler extends CommandHandler<
  CreateActionCommand,
  string
> {
  constructor(
    @Inject(ActionsRepositoryToken)
    private readonly actionRepository: Action.Repository,
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly notificationService: Notification.Service,
    private readonly actionFactory: Action.Factory,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly conseillerAuthorizer: ConseillerAuthorizer,
    private evenementService: EvenementService,
    private planificateurService: PlanificateurService
  ) {
    super('CreateActionCommandHandler')
  }

  async handle(command: CreateActionCommand): Promise<Result<string>> {
    const jeune = await this.jeuneRepository.get(command.idJeune, {
      avecConfiguration: true
    })
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    const result = this.actionFactory.buildAction(command, jeune)
    if (isFailure(result)) {
      return result
    }

    const action = result.data
    await this.actionRepository.save(action)

    if (this.actionFactory.doitPlanifierUneNotificationDeRappel(action)) {
      await this.planifierRappelAction(action)
    }

    if (command.typeCreateur !== Action.TypeCreateur.JEUNE) {
      await this.notificationService.notifierNouvelleAction(jeune, action)
    }

    return success(action.id)
  }

  async authorize(
    command: CreateActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type === Authentification.Type.JEUNE) {
      return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
    } else {
      return this.conseillerAuthorizer.authorize(
        command.idCreateur,
        utilisateur,
        command.idJeune
      )
    }
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateActionCommand
  ): Promise<void> {
    const vientDuReferentiel = Action.ACTIONS_PREDEFINIES.some(
      ({ titre }) => titre === command.contenu
    )
    await this.evenementService.creer(
      vientDuReferentiel
        ? Evenement.Code.ACTION_PREDEFINIE_CREEE
        : Evenement.Code.ACTION_CREEE,
      utilisateur
    )
  }

  private async planifierRappelAction(action: Action): Promise<void> {
    try {
      await this.planificateurService.planifierRappelAction(action)
    } catch (e) {
      this.logger.error(
        buildError(
          `La planification de la notification de l'action ${action.id} a échoué`,
          e
        )
      )
      this.apmService.captureError(e)
    }
  }
}
