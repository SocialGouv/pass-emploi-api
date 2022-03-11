import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { FavoriNonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  EngagementRepositoryToken,
  OffreEngagement
} from '../../domain/offre-engagement'
import { FavoriOffreEngagementAuthorizer } from '../authorizers/authorize-favori-offres-engagement'

export interface DeleteFavoriOffreEngagementCommand extends Command {
  idOffre: string
  idJeune: string
}

@Injectable()
export class DeleteFavoriOffreEngagementCommandHandler extends CommandHandler<
  DeleteFavoriOffreEngagementCommand,
  void
> {
  constructor(
    @Inject(EngagementRepositoryToken)
    private readonly offreEngagementRepository: OffreEngagement.Repository,
    private readonly favoriOffreEngagementAuthorizer: FavoriOffreEngagementAuthorizer
  ) {
    super('DeleteFavoriCommandHandler')
  }

  async handle(command: DeleteFavoriOffreEngagementCommand): Promise<Result> {
    const favoriOffre = await this.offreEngagementRepository.getFavori(
      command.idJeune,
      command.idOffre
    )

    if (!favoriOffre) {
      return failure(new FavoriNonTrouveError(command.idJeune, command.idOffre))
    }
    await this.offreEngagementRepository.deleteFavori(
      command.idJeune,
      command.idOffre
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteFavoriOffreEngagementCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.favoriOffreEngagementAuthorizer.authorize(
      command.idJeune,
      command.idOffre,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
