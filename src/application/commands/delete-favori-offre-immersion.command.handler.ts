import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  FavoriNonTrouveError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { FavoriAuthorizer } from '../authorizers/authorize-favori'
import {
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'

export interface DeleteFavoriOffreImmersionCommand extends Command {
  idOffreImmersion: string
  idJeune: string
}

@Injectable()
export class DeleteFavoriOffreImmersionCommandHandler extends CommandHandler<
  DeleteFavoriOffreImmersionCommand,
  void
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private readonly offresImmersionRepository: OffresImmersion.Repository,
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly favoriAuthorizer: FavoriAuthorizer
  ) {
    super('DeleteFavoriCommandHandler')
  }

  async handle(
    command: DeleteFavoriOffreImmersionCommand
  ): Promise<Result<void>> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }
    const favoriOffreEmploi = await this.offresImmersionRepository.getFavori(
      command.idJeune,
      command.idOffreImmersion
    )
    if (!favoriOffreEmploi) {
      return failure(
        new FavoriNonTrouveError(command.idJeune, command.idOffreImmersion)
      )
    }
    await this.offresImmersionRepository.deleteFavori(
      command.idJeune,
      command.idOffreImmersion
    )
    this.logger.log(
      `L'offre ${command.idOffreImmersion} a été supprimée des favoris du jeune ${command.idJeune}`
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteFavoriOffreImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.favoriAuthorizer.authorize(
      command.idJeune,
      command.idOffreImmersion,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
