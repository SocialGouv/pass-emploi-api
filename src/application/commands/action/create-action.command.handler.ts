import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import {
  failure,
  isFailure,
  Result,
  success
} from '../../../building-blocks/types/result'
import { Action, ActionRepositoryToken } from '../../../domain/action/action'
import { Authentification } from '../../../domain/authentification'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { Jeune, JeuneRepositoryToken } from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import { PlanificateurService } from '../../../domain/planificateur'
import { buildError } from '../../../utils/logger.module'
import { ConseillerAuthorizer } from '../../authorizers/conseiller-authorizer'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'

export interface CreateActionCommand extends Command {
  idJeune: Jeune.Id
  contenu: string
  idCreateur: Action.IdCreateur
  typeCreateur: Action.TypeCreateur
  statut?: Action.Statut
  commentaire?: string
  dateEcheance: DateTime
  rappel?: boolean
  codeQualification?: Action.Qualification.Code
  estDuplicata?: boolean
}

@Injectable()
export class CreateActionCommandHandler extends CommandHandler<
  CreateActionCommand,
  string
> {
  constructor(
    @Inject(ActionRepositoryToken)
    private readonly actionRepository: Action.Repository,
    @Inject(JeuneRepositoryToken)
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
    const jeune = await this.jeuneRepository.get(command.idJeune)
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
    if (Authentification.estJeune(utilisateur.type)) {
      return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
    } else {
      return this.conseillerAuthorizer.autoriserLeConseillerPourSonJeune(
        command.idCreateur,
        command.idJeune,
        utilisateur
      )
    }
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateActionCommand
  ): Promise<void> {
    if (Authentification.estJeune(utilisateur.type)) {
      if (command.estDuplicata) {
        await this.evenementService.creer(
          Evenement.Code.ACTION_DUPLIQUEE,
          utilisateur
        )
      } else {
        await this.evenementService.creer(
          command.codeQualification
            ? Evenement.Code.ACTION_CREEE_SUGGESTION
            : Evenement.Code.ACTION_CREEE_HORS_SUGGESTION,
          utilisateur
        )
      }
    } else {
      const vientDuReferentiel = Action.ACTIONS_PREDEFINIES.some(
        ({ titre }) => titre === command.contenu
      )
      await this.evenementService.creer(
        vientDuReferentiel
          ? Evenement.Code.ACTION_CREEE_REFERENTIEL
          : Evenement.Code.ACTION_CREEE_HORS_REFERENTIEL,
        utilisateur
      )
    }
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
