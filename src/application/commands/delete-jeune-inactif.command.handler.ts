import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  JeuneNonLieAuConseillerError,
  JeunePasInactifError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Chat, ChatRepositoryToken } from '../../domain/chat'
import { Conseiller, ConseillerRepositoryToken } from '../../domain/conseiller'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

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
    @Inject(ConseillerRepositoryToken)
    private readonly conseillerRepository: Conseiller.Repository,
    @Inject(JeuneRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    @Inject(ChatRepositoryToken)
    private readonly chatRepository: Chat.Repository,
    private readonly conseillerAuthorizer: ConseillerAuthorizer
  ) {
    super('DeleteJeuneInactifCommandHandler')
  }

  async authorize(
    _command: DeleteJeuneInactifCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserToutConseiller(utilisateur)
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

    await this.jeuneRepository.supprimer(idJeune)
    await this.chatRepository.supprimerChat(idJeune)

    return emptySuccess()
  }

  async monitor(): Promise<void> {
    return
  }
}
