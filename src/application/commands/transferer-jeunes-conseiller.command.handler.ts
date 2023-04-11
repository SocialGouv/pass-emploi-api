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
import {
  Conseiller,
  ConseillersRepositoryToken
} from '../../domain/conseiller/conseiller'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { RendezVous } from '../../domain/rendez-vous/rendez-vous'
import { SupportAuthorizer } from '../authorizers/authorize-support'

export interface TransfererJeunesConseillerCommand extends Command {
  idConseillerSource: string
  idConseillerCible: string
  idsJeunes: string[]
  estTemporaire: boolean
  structure?: Core.Structure
  provenanceUtilisateur: Extract<
    Authentification.Type,
    Authentification.Type.SUPPORT | Authentification.Type.CONSEILLER
  >
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
    private listeDeDiffusionService: Conseiller.ListeDeDiffusion.Service,
    @Inject(ChatRepositoryToken)
    private chatRepository: Chat.Repository,
    private animationCollectiveService: RendezVous.AnimationCollective.Service,
    private conseillerAuthorizer: ConseillerAuthorizer,
    private supportAuthorizer: SupportAuthorizer
  ) {
    super('TransfererJeunesConseillerCommandHandler')
  }

  async handle(command: TransfererJeunesConseillerCommand): Promise<Result> {
    const [conseillerSource, conseillerCible, jeunes] = await Promise.all([
      this.conseillerRepository.get(command.idConseillerSource),
      this.conseillerRepository.get(command.idConseillerCible),
      this.jeuneRepository.findAllJeunesByIdsAndConseiller(
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

    if (command.provenanceUtilisateur === Authentification.Type.CONSEILLER) {
      if (
        command.structure !== conseillerSource.structure ||
        command.structure !== conseillerCible.structure
      ) {
        return failure(
          new MauvaiseCommandeError(
            'Les informations de structure ne correspondent pas'
          )
        )
      }
    } else if (
      command.provenanceUtilisateur === Authentification.Type.SUPPORT
    ) {
      if (conseillerSource.structure !== conseillerCible.structure) {
        return failure(
          new MauvaiseCommandeError(
            'Les informations de structure ne correspondent pas'
          )
        )
      }
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
      await this.animationCollectiveService.desinscrireJeunesDesAnimationsCollectivesDUnEtablissement(
        command.idsJeunes,
        conseillerSource.agence.id
      )
    }

    if (!command.estTemporaire) {
      await this.listeDeDiffusionService.enleverLesJeunesDuConseiller(
        command.idConseillerSource,
        command.idsJeunes
      )
    }

    updatedJeunes.forEach(jeune =>
      this.chatRepository.envoyerMessageTransfert(jeune)
    )

    return emptySuccess()
  }

  async authorize(
    command: TransfererJeunesConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    switch (command.provenanceUtilisateur) {
      case Authentification.Type.CONSEILLER:
        return this.conseillerAuthorizer.authorizeSuperviseur(utilisateur)
      case Authentification.Type.SUPPORT:
        return this.supportAuthorizer.authorize(utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
