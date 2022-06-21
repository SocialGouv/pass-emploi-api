import { Inject, Injectable } from '@nestjs/common'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Core } from 'src/domain/core'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { Chat, ChatRepositoryToken } from '../../domain/chat'

export interface TransfererJeunesConseillerCommand extends Command {
  idConseillerSource: string
  idConseillerCible: string
  idsJeunes: string[]
  estTemporaire: boolean
  structure: Core.Structure
}

@Injectable()
export class TransfererJeunesConseillerCommandHandler extends CommandHandler<
  TransfererJeunesConseillerCommand,
  void
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('TransfererJeunesConseillerCommandHandler')
  }

  async handle(command: TransfererJeunesConseillerCommand): Promise<Result> {
    const [conseillerSourceExiste, conseillerCible, jeunes] = await Promise.all(
      [
        this.conseillerRepository.existe(
          command.idConseillerSource,
          command.structure
        ),
        this.conseillerRepository.get(command.idConseillerCible),
        this.jeuneRepository.findAllJeunesByConseiller(
          command.idsJeunes,
          command.idConseillerSource
        )
      ]
    )

    if (!conseillerSourceExiste) {
      return failure(
        new NonTrouveError('Conseiller', command.idConseillerSource)
      )
    }
    if (!conseillerCible) {
      return failure(
        new NonTrouveError('Conseiller', command.idConseillerCible)
      )
    }
    if (jeunes?.length !== command.idsJeunes.length) {
      return failure(
        new MauvaiseCommandeError('Liste des jeunes à transférer invalide')
      )
    }

    const updatedJeunes: Jeune[] = Jeune.transfererLesJeunes(
      jeunes,
      conseillerCible,
      command.idConseillerSource,
      command.estTemporaire
    )

    await this.jeuneRepository.transferAndSaveAll(
      updatedJeunes,
      command.idConseillerCible,
      command.idConseillerSource,
      command.estTemporaire
    )

    updatedJeunes.forEach(jeune =>
      this.chatRepository.envoyerMessageTransfert(jeune)
    )

    return emptySuccess()
  }

  async authorize(
    _command: TransfererJeunesConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.conseillerAuthorizer.authorizeSuperviseur(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
