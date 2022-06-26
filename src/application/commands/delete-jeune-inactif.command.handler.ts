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

export interface DeleteJeuneInactifCommand {
  idConseiller: string
  idJeune: Jeune.Id
}

@Injectable()
export class DeleteJeuneInactifCommandHandler extends CommandHandler<
  DeleteJeuneInactifCommand,
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
    super('DeleteJeuneInactifCommandHandler')
  }

  async authorize(
    _command: DeleteJeuneInactifCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (utilisateur.type !== Authentification.Type.CONSEILLER) {
      return failure(new DroitsInsuffisants())
    }
    return emptySuccess()
  }

  async handle({
    idConseiller,
    idJeune
  }: DeleteJeuneInactifCommand): Promise<Result> {
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
