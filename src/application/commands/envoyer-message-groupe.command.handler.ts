import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatIndividuel, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller } from '../../domain/conseiller'
import {
  ListeDeDiffusion,
  ListeDeDiffusionRepositoryToken
} from '../../domain/milo/liste-de-diffusion'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Notification } from '../../domain/notification/notification'
import { ListeDeDiffusionAuthorizer } from '../authorizers/liste-de-diffusion-authorizer'
import Code = Evenement.Code
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

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
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private authorizeListeDeDiffusion: ListeDeDiffusionAuthorizer,
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

    if (command.idsBeneficiaires) {
      const result =
        await this.conseillerAuthorizer.autoriserConseillerPourSesJeunes(
          command.idsBeneficiaires,
          utilisateur
        )
      if (isFailure(result)) {
        return result
      }
    }

    if (command.idsListesDeDiffusion) {
      for (const idListe of command.idsListesDeDiffusion) {
        const result =
          await this.authorizeListeDeDiffusion.autoriserConseillerPourSaListeDeDiffusion(
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
    await this.evenementService.creer(getCodeEvenement(command), utilisateur)
  }
}

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}

function isUnique(value: string, index: number, self: string[]): boolean {
  return self.indexOf(value) === index
}

function getCodeEvenement(
  command: EnvoyerMessageGroupeCommand
): Evenement.Code {
  const avecPj = Boolean(command.infoPieceJointe)
  const auMoinsUnBeneficiaire =
    command.idsBeneficiaires && command.idsBeneficiaires.length > 0
  const plusieursBeneficiaires =
    command.idsBeneficiaires && command.idsBeneficiaires.length > 1
  const auMoinsUneListe =
    command.idsListesDeDiffusion && command.idsListesDeDiffusion.length > 0

  if (auMoinsUnBeneficiaire && auMoinsUneListe)
    return avecPj
      ? Code.MESSAGE_ENVOYE_MULTIPLE_MIXTE_PJ
      : Code.MESSAGE_ENVOYE_MULTIPLE_MIXTE

  if (auMoinsUneListe)
    return avecPj
      ? Code.MESSAGE_ENVOYE_MULTIPLE_LISTE_PJ
      : Code.MESSAGE_ENVOYE_MULTIPLE_LISTE

  if (plusieursBeneficiaires)
    return avecPj
      ? Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL_PJ
      : Code.MESSAGE_ENVOYE_MULTIPLE_MANUEL

  return avecPj
    ? Evenement.Code.MESSAGE_ENVOYE_PJ
    : Evenement.Code.MESSAGE_ENVOYE
}
