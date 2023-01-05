import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatIndividuel, ChatRepositoryToken } from '../../domain/chat'
import { AuthorizeConseillerForJeunes } from '../authorizers/authorize-conseiller-for-jeunes'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'
import {
  ListeDeDiffusionRepositoryToken,
  ListeDeDiffusion
} from '../../domain/conseiller/liste-de-diffusion'
import { Conseiller } from '../../domain/conseiller/conseiller'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import { AuthorizeListeDeDiffusion } from '../authorizers/authorize-liste-de-diffusion'

export interface EnvoyerMessageGroupeCommand extends Command {
  idsBeneficiaires?: string[]
  idsListesDeDiffusion?: string[]
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
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private authorizeConseillerForJeunes: AuthorizeConseillerForJeunes,
    private authorizeListeDeDiffusion: AuthorizeListeDeDiffusion,
    private evenementService: EvenementService,
    private notificationService: Notification.Service
  ) {
    super('EnvoyerMessageGroupeCommandHandler')
  }

  async handle(command: EnvoyerMessageGroupeCommand): Promise<Result> {
    const { idsBeneficiaires, idsListesDeDiffusion } = command

    let idsBeneficiaireDesListesDeDiffusion: string[] = []

    if (idsListesDeDiffusion) {
      const listesDeDiffusion = await this.listeDeDiffusionRepository.findAll(
        idsListesDeDiffusion
      )

      await this.envoyerLesMessagesAuxListesDeDiffusion(
        listesDeDiffusion,
        command
      )

      idsBeneficiaireDesListesDeDiffusion =
        ListeDeDiffusion.getIdsBeneficiaireDesListesDeDiffusion(
          listesDeDiffusion
        )
    }

    const idsBeneficiairesUniques = idsBeneficiaireDesListesDeDiffusion
      .concat(idsBeneficiaires || [])
      .filter(isUnique)

    const chats = await Promise.all(
      idsBeneficiairesUniques.map(id =>
        this.chatRepository.recupererConversationIndividuelle(id)
      )
    )

    const chatMessage = Chat.creerMessage(command)
    const chatsExistants: ChatIndividuel[] = chats.filter(isDefined)
    if (chatsExistants.length !== chats.length) {
      this.logger.error(
        'Il manque des chats pour les bénéficiaires du conseiller'
      )
    }

    await Promise.all(
      chatsExistants.map(({ id: idChat }) =>
        this.chatRepository.envoyerMessageIndividuel(idChat, chatMessage)
      )
    )

    const jeunes = await this.jeuneRepository.findAll(idsBeneficiairesUniques)

    this.notificationService.notifierLesJeunesDuNouveauMessage(jeunes)

    return emptySuccess()
  }

  private async envoyerLesMessagesAuxListesDeDiffusion(
    listesDeDiffusion: Conseiller.ListeDeDiffusion[],
    command: EnvoyerMessageGroupeCommand
  ): Promise<void> {
    await Promise.all(
      listesDeDiffusion.map(async liste => {
        const groupe = await this.chatRepository.recupererConversationGroupe(
          liste.id
        )
        if (!groupe) {
          this.logger.error(
            'Il manque des chats pour les bénéficiaires du conseiller'
          )
        } else {
          const groupeMessage = Chat.creerMessageGroupe({
            ...command,
            idsBeneficiaires: ListeDeDiffusion.getBeneficiairesDuPortefeuille(
              liste
            ).map(beneficiaire => beneficiaire.id)
          })

          await this.chatRepository.envoyerMessageGroupe(
            groupe.id,
            groupeMessage
          )
        }
      })
    )
  }

  async authorize(
    command: EnvoyerMessageGroupeCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (!command.idsBeneficiaires && !command.idsListesDeDiffusion) {
      return failure(new MauvaiseCommandeError('Aucun destinataire'))
    }

    let result: Result

    if (command.idsBeneficiaires) {
      result = await this.authorizeConseillerForJeunes.authorize(
        command.idsBeneficiaires,
        utilisateur
      )
      if (isFailure(result)) {
        return result
      }
    }

    if (command.idsListesDeDiffusion) {
      for (const idListe of command.idsListesDeDiffusion) {
        const result = await this.authorizeListeDeDiffusion.authorize(
          idListe,
          utilisateur
        )
        if (isFailure(result)) {
          return result
        }
      }
    }

    return emptySuccess()
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: EnvoyerMessageGroupeCommand
  ): Promise<void> {
    let code: Evenement.Code = Evenement.Code.MESSAGE_ENVOYE

    if (command.idsBeneficiaires!.length > 1) {
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

function isUnique(value: string, index: number, self: string[]): boolean {
  return self.indexOf(value) === index
}
