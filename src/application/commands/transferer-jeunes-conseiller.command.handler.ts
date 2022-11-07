import { Inject, Injectable } from '@nestjs/common'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Core } from '../../domain/core'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
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
import { RendezVous } from '../../domain/rendez-vous'

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
    private animationCollectiveService: RendezVous.AnimationCollective.Service,
    private conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('TransfererJeunesConseillerCommandHandler')
  }

  async handle(command: TransfererJeunesConseillerCommand): Promise<Result> {
    const [conseillerSource, conseillerCible, jeunes] = await Promise.all([
      this.conseillerRepository.get(command.idConseillerSource),
      this.conseillerRepository.get(command.idConseillerCible),
      this.jeuneRepository.findAllJeunesByConseiller(
        command.idsJeunes,
        command.idConseillerSource
      )
    ])

    if (!conseillerSource) {
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

    const updatedJeunes: Jeune[] = Jeune.changerDeConseiller(
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

    if (
      conseillerSource.agence?.id &&
      conseillerCible.agence?.id &&
      conseillerCible.agence.id !== conseillerSource.agence.id
    ) {
      await this.animationCollectiveService.desinscrire(
        command.idsJeunes,
        conseillerSource.agence.id
      )
    }

    updatedJeunes.forEach(jeune =>
      this.chatRepository.envoyerMessageTransfert(jeune)
    )

    return emptySuccess()
  }

  async authorize(
    _command: TransfererJeunesConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorizeSuperviseur(utilisateur)
  }

  async monitor(): Promise<void> {
    return
  }
}
