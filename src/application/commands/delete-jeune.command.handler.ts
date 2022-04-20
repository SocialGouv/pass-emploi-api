import { Inject, Injectable } from '@nestjs/common'
import { Conseiller, ConseillersRepositoryToken } from 'src/domain/conseiller'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Mail, MailClientToken } from 'src/domain/mail'
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

import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'

export interface DeleteJeuneCommand {
  idJeune: Jeune.Id
}

@Injectable()
export class DeleteJeuneCommandHandler extends CommandHandler<
  DeleteJeuneCommand,
  void
> {
  constructor(
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(ConseillersRepositoryToken)
    private readonly conseillerRepository: Conseiller.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    @Inject(AuthentificationRepositoryToken)
    private readonly authentificationRepository: Authentification.Repository,
    private evenementService: EvenementService,
    @Inject(MailClientToken)
    private readonly mailClient: Mail.Client,
    private mailFactory: Mail.Factory
  ) {
    super('DeleteJeuneCommandHandler')
  }

  async authorize(
    command: DeleteJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      utilisateur.type !== Authentification.Type.JEUNE ||
      command.idJeune !== utilisateur.id
    ) {
      throw new DroitsInsuffisants()
    }
  }

  async handle(command: DeleteJeuneCommand): Promise<Result> {
    const { idJeune } = command
    const jeune = await this.jeuneRepository.get(idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', idJeune))
    }

    await Promise.all([
      this.authentificationRepository.deleteJeuneIdp(idJeune),
      this.jeuneRepository.supprimer(idJeune),
      this.chatRepository.supprimerChat(idJeune)
    ])

    const conseiller = jeune.conseiller
      ? await this.conseillerRepository.get(jeune.conseiller.id)
      : undefined

    if (conseiller) {
      const mail = this.mailFactory.creerMailSuppressionJeune(conseiller, jeune)
      await this.mailClient.postMail(mail)
    }

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.COMPTE_SUPPRIME,
      utilisateur
    )
  }
}
