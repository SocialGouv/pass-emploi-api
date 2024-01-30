import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Mail, MailServiceToken } from '../../domain/mail'

import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Core } from '../../domain/core'

import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { SupportAuthorizer } from '../authorizers/support-authorizer'

export interface DeleteJeuneCommand {
  idJeune: Jeune.Id
  jeune?: {
    firstName: string
    lastName: string
    structure: Core.Structure
    email?: string
    idPartenaire?: string
  }
}

@Injectable()
export class DeleteJeuneCommandHandler extends CommandHandler<
  DeleteJeuneCommand,
  void
> {
  constructor(
    @Inject(JeuneRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private evenementService: EvenementService,
    @Inject(MailServiceToken)
    private readonly mailService: Mail.Service,
    private mailFactory: Mail.Factory,
    private jeuneAuthorizer: JeuneAuthorizer,
    private supportAuthorizer: SupportAuthorizer
  ) {
    super('DeleteJeuneCommandHandler')
  }

  async authorize(
    command: DeleteJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (Authentification.estJeune(utilisateur.type)) {
      return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
    }
    return this.supportAuthorizer.autoriserSupport(utilisateur)
  }

  async handle(command: DeleteJeuneCommand): Promise<Result> {
    const { idJeune } = command
    const jeune = await this.jeuneRepository.get(idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', idJeune))
    }

    //Mute la commande pour enrichir les logs
    command.jeune = {
      firstName: jeune.firstName,
      lastName: jeune.lastName,
      structure: jeune.structure,
      email: jeune.email,
      idPartenaire: jeune.idPartenaire
    }

    await this.authentificationRepository.deleteUtilisateurIdp(idJeune)
    await this.jeuneRepository.supprimer(idJeune)
    this.chatRepository.supprimerChat(idJeune)

    if (jeune.conseiller?.email) {
      const mail = this.mailFactory.creerMailSuppressionJeune(jeune)
      this.mailService.envoyer(mail)
    } else {
      this.logger.warn(
        `Email non envoyé au conseiller : ${JSON.stringify(jeune.conseiller)}`
      )
    }

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.COMPTE_SUPPRIME,
      utilisateur
    )
  }
}
