import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Mail, MailServiceToken } from '../../domain/mail'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import {
  Authentification,
  AuthentificationRepositoryToken
} from '../../domain/authentification'

import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Core } from '../../domain/core'

import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'

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
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private evenementService: EvenementService,
    @Inject(MailServiceToken)
    private readonly mailService: Mail.Service,
    private mailFactory: Mail.Factory
  ) {
    super('DeleteJeuneCommandHandler')
  }

  async authorize(
    command: DeleteJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const estLeJeune =
      utilisateur.type === Authentification.Type.JEUNE &&
      command.idJeune === utilisateur.id
    const estDuSupport = utilisateur.type === Authentification.Type.SUPPORT
    if (estLeJeune || estDuSupport) {
      return emptySuccess()
    } else {
      return failure(new DroitsInsuffisants())
    }
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
    await this.chatRepository.supprimerChat(idJeune)

    if (jeune.conseiller?.email) {
      const mail = this.mailFactory.creerMailSuppressionJeune(jeune)
      await this.mailService.envoyer(mail)
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
