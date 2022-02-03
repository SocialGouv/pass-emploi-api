import { Inject, Injectable } from '@nestjs/common'
import {
  JeuneNonLieAuConseillerError,
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
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'

export interface TransfererJeunesConseillerCommand extends Command {
  idConseillerSource: string
  idConseillerCible: string
  idsJeune: string[]
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
    const [conseillerSourceExiste, conseillerCibleExiste, conseillerCible] =
      await Promise.all([
        this.conseillerRepository.existe(
          command.idConseillerSource,
          command.structure
        ),
        this.conseillerRepository.existe(
          command.idConseillerCible,
          command.structure
        ),
        this.conseillerRepository.get(command.idConseillerCible)
      ])

    if (!conseillerSourceExiste) {
      return failure(
        new NonTrouveError('Conseiller', command.idConseillerSource)
      )
    }
    if (!conseillerCibleExiste || !conseillerCible) {
      return failure(
        new NonTrouveError('Conseiller', command.idConseillerCible)
      )
    }

    const jeunes: Jeune[] = []
    for (const idJeune of command.idsJeune) {
      const jeune = await this.jeuneRepository.get(idJeune)

      if (!jeune) {
        return failure(new NonTrouveError('Jeune', idJeune))
      }

      if (jeune.conseiller.id !== command.idConseillerSource) {
        return failure(
          new JeuneNonLieAuConseillerError(command.idConseillerSource, idJeune)
        )
      }

      const updatedJeune = { ...jeune, conseiller: conseillerCible }
      jeunes.push(updatedJeune)
    }

    await Promise.all([
      this.jeuneRepository.saveAll(jeunes),
      this.jeuneRepository.creerTransferts(
        command.idConseillerSource,
        command.idConseillerCible,
        command.idsJeune
      ),
      this.chatRepository.transfererChat(
        command.idConseillerCible,
        command.idsJeune
      )
    ])

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
