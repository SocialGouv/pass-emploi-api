import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import {
  Conseiller,
  ConseillerRepositoryToken
} from '../../domain/milo/conseiller'
import { estPoleEmploiBRSA } from '../../domain/core'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { RendezVous } from '../../domain/rendez-vous/rendez-vous'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { SupportAuthorizer } from '../authorizers/support-authorizer'

export interface TransfererJeunesConseillerCommand extends Command {
  idConseillerSource: string
  idConseillerCible: string
  idsJeunes: string[]
  estTemporaire: boolean
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
    @Inject(ConseillerRepositoryToken)
    private conseillerRepository: Conseiller.Repository,
    @Inject(JeuneRepositoryToken)
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

  async handle(
    command: TransfererJeunesConseillerCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
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

    let typeTransfert: Jeune.TypeTransfert
    if (command.provenanceUtilisateur === Authentification.Type.CONSEILLER) {
      const superviseurDansLaMemeStructureQueConseillerSourceEtCible =
        utilisateur.structure === conseillerSource.structure &&
        utilisateur.structure === conseillerCible.structure

      const conseillerSourceEtCibleDansLaMemeStructure =
        estPoleEmploiBRSA(conseillerSource.structure) &&
        estPoleEmploiBRSA(conseillerCible.structure) &&
        conseillerSource.structure === conseillerCible.structure

      if (Authentification.estSuperviseurPEBRSA(utilisateur)) {
        if (!conseillerSourceEtCibleDansLaMemeStructure)
          return failure(
            new MauvaiseCommandeError(
              'Les informations de structure des conseillers source et cible ne correspondent pas'
            )
          )
      } else {
        if (!superviseurDansLaMemeStructureQueConseillerSourceEtCible) {
          return failure(
            new MauvaiseCommandeError(
              'Les informations de structure ne correspondent pas'
            )
          )
        }
      }
      typeTransfert = command.estTemporaire
        ? Jeune.TypeTransfert.TEMPORAIRE
        : Jeune.TypeTransfert.DEFINITIF
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
      typeTransfert = command.estTemporaire
        ? Jeune.TypeTransfert.TEMPORAIRE_SUPPORT
        : Jeune.TypeTransfert.DEFINITIF_SUPPORT
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
      utilisateur.id,
      typeTransfert!
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
        return this.conseillerAuthorizer.autoriserConseillerSuperviseur(
          utilisateur
        )
      case Authentification.Type.SUPPORT:
        return this.supportAuthorizer.autoriserSupport(utilisateur)
    }
  }

  async monitor(): Promise<void> {
    return
  }
}
