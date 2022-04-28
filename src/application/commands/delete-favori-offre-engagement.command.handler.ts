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
  OffreServiceCiviqueRepositoryToken,
  OffreServiceCivique
} from '../../domain/offre-service-civique'
import { FavoriOffreServiceCiviqueAuthorizer } from '../authorizers/authorize-favori-offres-engagement'

export interface DeleteFavoriOffreServiceCiviqueCommand extends Command {
  idOffre: string
  idJeune: string
}

@Injectable()
export class DeleteFavoriOffreEngagementCommandHandler extends CommandHandler<
  DeleteFavoriOffreServiceCiviqueCommand,
  void
> {
  constructor(
    @Inject(OffreServiceCiviqueRepositoryToken)
    private readonly offreServiceCiviqueRepository: OffreServiceCivique.Repository,
    private readonly favoriOffreEngagementAuthorizer: FavoriOffreServiceCiviqueAuthorizer
  ) {
    super('DeleteFavoriCommandHandler')
  }

  async handle(
    command: DeleteFavoriOffreServiceCiviqueCommand
  ): Promise<Result> {
    const favoriOffre = await this.offreServiceCiviqueRepository.getFavori(
      command.idJeune,
      command.idOffre
    )

    if (!favoriOffre) {
      return failure(new FavoriNonTrouveError(command.idJeune, command.idOffre))
    }
    await this.offreServiceCiviqueRepository.deleteFavori(
      command.idJeune,
      command.idOffre
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteFavoriOffreServiceCiviqueCommand,
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
