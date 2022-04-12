import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from 'src/domain/evenement'
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
import { Authentification } from '../../domain/authentification'

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
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    private evenementService: EvenementService
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
      this.jeuneRepository.supprimer(idJeune),
      this.chatRepository.supprimerChat(idJeune)
    ])
    // TODO: envoyer un email au conseiller
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.COMPTE_SUPPRIME,
      utilisateur
    )
  }
}
