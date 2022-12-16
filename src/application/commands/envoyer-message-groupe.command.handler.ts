import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { AuthorizeConseillerForJeunes } from '../authorizers/authorize-conseiller-for-jeunes'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'

export interface EnvoyerMessageGroupeCommand extends Command {
  idsBeneficiaires: string[]
  message: string
  iv: string
  idConseiller: string
  infoPieceJointe?: {
    id: string
    nom: string
  }
}

@Injectable()
export class EnvoyerMessageGroupeCommandHandler extends CommandHandler<
  EnvoyerMessageGroupeCommand,
  void
> {
  constructor(
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private authorizeConseillerForJeunes: AuthorizeConseillerForJeunes,
    private evenementService: EvenementService,
    private notificationService: Notification.Service
  ) {
    super('EnvoyerMessageGroupeCommandHandler')
  }

  async handle(command: EnvoyerMessageGroupeCommand): Promise<Result> {
    const { idsBeneficiaires } = command

    const chats = await Promise.all(
      idsBeneficiaires.map(id => this.chatRepository.recupererChat(id))
    )

    const chatMessage = Chat.creerMessage(command)

    if (isFailure(chatMessage)) {
      return chatMessage
    }

    const chatsExistants: Chat[] = chats.filter(isDefined)
    if (chatsExistants.length !== chats.length) {
      this.logger.error(
        'Il manque des chats pour les bénéficiaires du conseiller'
      )
    }

    await Promise.all(
      chatsExistants.map(({ id: idChat }) =>
        this.chatRepository.envoyerMessageBeneficiaire(idChat, chatMessage.data)
      )
    )

    const jeunes = await this.jeuneRepository.findAllJeunesByConseiller(
      command.idsBeneficiaires,
      command.idConseiller
    )

    this.notificationService.notifierLesJeunesDuNouveauMessage(jeunes)

    return emptySuccess()
  }

  async authorize(
    command: EnvoyerMessageGroupeCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.authorizeConseillerForJeunes.authorize(
      command.idsBeneficiaires,
      utilisateur
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: EnvoyerMessageGroupeCommand
  ): Promise<void> {
    let code: Evenement.Code = Evenement.Code.MESSAGE_ENVOYE

    if (command.idsBeneficiaires.length > 1) {
      if (command.infoPieceJointe) {
        code = Evenement.Code.MESSAGE_ENVOYE_MULTIPLE_PJ
      } else {
        code = Evenement.Code.MESSAGE_ENVOYE_MULTIPLE
      }
    } else if (command.infoPieceJointe) {
      code = Evenement.Code.MESSAGE_ENVOYE_PJ
    }
    await this.evenementService.creer(code, utilisateur)
  }
}

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}
