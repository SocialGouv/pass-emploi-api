import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { failure, Result, success } from '../../../building-blocks/types/result'
import { Command } from '../../../building-blocks/types/command'
import { NonTrouveError } from '../../../building-blocks/types/domain-error'
import { ActionAuthorizer } from '../../authorizers/action-authorizer'
import { Authentification } from '../../../domain/authentification'
import {
  Action,
  ActionRepositoryToken,
  CommentaireActionRepositoryToken
} from '../../../domain/action/action'
import { Inject } from '@nestjs/common'
import {
  Jeune,
  JeuneConfigurationApplicationRepositoryToken
} from '../../../domain/jeune/jeune'
import { Notification } from '../../../domain/notification/notification'
import { Evenement, EvenementService } from '../../../domain/evenement'

export interface AddCommentaireActionCommand extends Command {
  idAction: string
  commentaire: string
  createur: Authentification.Utilisateur
}

export class AddCommentaireActionCommandHandler extends CommandHandler<
  AddCommentaireActionCommand,
  Action.Commentaire
> {
  constructor(
    private actionAuthorizer: ActionAuthorizer,
    @Inject(ActionRepositoryToken)
    private actionRepository: Action.Repository,
    @Inject(CommentaireActionRepositoryToken)
    private commentaireActionRepository: Action.Commentaire.Repository,
    private commentaireActionFactory: Action.Commentaire.Factory,
    @Inject(JeuneConfigurationApplicationRepositoryToken)
    private jeuneConfigurationApplicationRepository: Jeune.ConfigurationApplication.Repository,
    private notificationService: Notification.Service,
    private evenementService: EvenementService
  ) {
    super('AddCommentaireActionCommandHandler')
  }

  async authorize(
    command: AddCommentaireActionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.actionAuthorizer.autoriserPourUneAction(
      command.idAction,
      utilisateur
    )
  }

  async handle(
    command: AddCommentaireActionCommand
  ): Promise<Result<Action.Commentaire>> {
    const action = await this.actionRepository.get(command.idAction)

    if (!action) {
      return failure(new NonTrouveError('Action', command.idAction))
    }

    const commentaire = this.commentaireActionFactory.build(
      action,
      command.commentaire,
      this.buildCreateur(command)
    )
    await this.commentaireActionRepository.save(commentaire)

    if (!Authentification.estJeune(command.createur.type)) {
      await this.notifier(action)
    }
    return success(commentaire)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.ACTION_COMMENTEE,
      utilisateur
    )
  }

  private async notifier(action: Action): Promise<void> {
    const configAppJeune =
      await this.jeuneConfigurationApplicationRepository.get(action.idJeune)
    await this.notificationService.notifierNouveauCommentaireAction(
      action.id,
      configAppJeune
    )
  }

  private buildCreateur(command: AddCommentaireActionCommand): Action.Createur {
    return {
      id: command.createur.id,
      type: this.getType(command.createur.type),
      nom: command.createur.nom,
      prenom: command.createur.prenom
    }
  }

  private getType(typeUtilisateur: Authentification.Type): Action.TypeCreateur {
    return Authentification.estJeune(typeUtilisateur)
      ? Action.TypeCreateur.JEUNE
      : Action.TypeCreateur.CONSEILLER
  }
}
