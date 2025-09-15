import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Conseiller, ConseillerRepositoryToken } from '../../domain/conseiller'
import { RendezVous } from '../../domain/rendez-vous/rendez-vous'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { SupportAuthorizer } from '../authorizers/support-authorizer'

export interface TransfererJeunesConseillerCommand extends Command {
  idConseillerSource: string
  idConseillerCible: string
  idsJeunes: string[]
  estTemporaire: boolean
  provenanceUtilisateur:
    | Authentification.Type.CONSEILLER
    | Authentification.Type.SUPPORT
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
    const entites = await Promise.all([
      this.conseillerRepository.get(command.idConseillerSource),
      this.conseillerRepository.get(command.idConseillerCible),
      this.jeuneRepository.findAllJeunesByIdsAndConseiller(
        command.idsJeunes,
        command.idConseillerSource
      )
    ])

    const verificationEntites = verifierEntites(entites, command)
    if (isFailure(verificationEntites)) return verificationEntites
    const [conseillerSource, conseillerCible, jeunes] = entites as [
      Conseiller,
      Conseiller,
      Jeune[]
    ]

    const verificationStructures = verifierStructures(
      command,
      utilisateur,
      conseillerSource,
      conseillerCible
    )
    if (isFailure(verificationStructures)) return verificationStructures

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
      getTypeTransfert(command)
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

function verifierEntites(
  [conseillerSource, conseillerCible, jeunes]: [
    Conseiller | undefined,
    Conseiller | undefined,
    Jeune[]
  ],
  command: TransfererJeunesConseillerCommand
): Result {
  if (!conseillerSource) {
    return failure(new NonTrouveError('Conseiller', command.idConseillerSource))
  }
  if (!conseillerCible) {
    return failure(new NonTrouveError('Conseiller', command.idConseillerCible))
  }
  if (jeunes?.length !== command.idsJeunes.length) {
    return failure(
      new MauvaiseCommandeError('Liste des jeunes à transférer invalide')
    )
  }
  return emptySuccess()
}

function verifierStructures(
  command: TransfererJeunesConseillerCommand,
  utilisateur: Authentification.Utilisateur,
  conseillerSource: Conseiller,
  conseillerCible: Conseiller
): Result {
  switch (command.provenanceUtilisateur) {
    case Authentification.Type.CONSEILLER:
      return verifierStructuresPourConseiller(
        utilisateur,
        conseillerSource,
        conseillerCible
      )
    case Authentification.Type.SUPPORT:
      return verifierStructuresPourSupport(conseillerSource, conseillerCible)
  }
}

function verifierStructuresPourConseiller(
  utilisateur: Authentification.Utilisateur,
  conseillerSource: Conseiller,
  conseillerCible: Conseiller
): Result {
  if (
    Authentification.estSuperviseurResponsable(
      utilisateur,
      conseillerSource.structure
    )
  ) {
    const conseillerSourceEtCibleDansLaMemeStructure =
      conseillerSource.structure === conseillerCible.structure

    if (!conseillerSourceEtCibleDansLaMemeStructure)
      return failure(
        new MauvaiseCommandeError(
          'Les informations de structure des conseillers source et cible ne correspondent pas'
        )
      )
  } else {
    const superviseurDansLaMemeStructureQueConseillerSourceEtCible =
      utilisateur.structure === conseillerSource.structure &&
      utilisateur.structure === conseillerCible.structure

    if (!superviseurDansLaMemeStructureQueConseillerSourceEtCible) {
      return failure(
        new MauvaiseCommandeError(
          'Les informations de structure ne correspondent pas'
        )
      )
    }
  }

  return emptySuccess()
}

function verifierStructuresPourSupport(
  conseillerSource: Conseiller,
  conseillerCible: Conseiller
): Result {
  if (conseillerSource.structure !== conseillerCible.structure) {
    return failure(
      new MauvaiseCommandeError(
        'Les informations de structure ne correspondent pas'
      )
    )
  }

  return emptySuccess()
}

function getTypeTransfert(
  command: TransfererJeunesConseillerCommand
): Jeune.TypeTransfert {
  switch (command.provenanceUtilisateur) {
    case Authentification.Type.CONSEILLER:
      return command.estTemporaire
        ? Jeune.TypeTransfert.TEMPORAIRE
        : Jeune.TypeTransfert.DEFINITIF
    case Authentification.Type.SUPPORT:
      return command.estTemporaire
        ? Jeune.TypeTransfert.TEMPORAIRE_SUPPORT
        : Jeune.TypeTransfert.DEFINITIF_SUPPORT
  }
}
