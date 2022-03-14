import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller, ConseillersRepositoryToken } from '../../domain/conseiller'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'

export interface DeleteJeuneCommand {
  idConseiller: string
  idJeune: Jeune.Id
}

@Injectable()
export class DeleteJeuneCommandHandler extends CommandHandler<
  DeleteJeuneCommand,
  void
> {
  constructor(
    @Inject(ConseillersRepositoryToken)
    private readonly conseillerRepository: Conseiller.Repository,
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository
  ) {
    super('DeleteJeune')
  }

  async authorize(
    _command: DeleteJeuneCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (utilisateur.type !== Authentification.Type.CONSEILLER) {
      throw new DroitsInsuffisants()
    }
  }

  async handle({ idConseiller, idJeune }: DeleteJeuneCommand): Promise<Result> {
    const conseiller = await this.conseillerRepository.get(idConseiller)
    if (!conseiller) {
      return failure(new NonTrouveError('Conseiller', idConseiller))
    }

    const jeune = await this.jeuneRepository.get(idJeune)
    if (!jeune) return failure(new NonTrouveError('Jeune', idJeune))

    if (jeune.conseiller?.id !== conseiller.id) {
      return failure(new JeuneNonLieAuConseillerError(idConseiller, idJeune))
    }

    if (jeune.isActivated) return failure(new JeunePasInactifError(jeune.id))

    await Promise.all([
      this.jeuneRepository.supprimer(idJeune),
      this.chatRepository.supprimerChat(idJeune)
    ])
    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
