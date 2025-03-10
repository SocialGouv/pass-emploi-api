import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { FavorisOffresServiceCiviqueRepositoryToken } from '../../domain/offre/favori/offre-service-civique'
import { FavoriOffreServiceCiviqueAuthorizer } from '../authorizers/favori-offres-engagement-authorizer'
import { Offre } from '../../domain/offre/offre'

export interface DeleteFavoriOffreServiceCiviqueCommand extends Command {
  idOffre: string
  idJeune: string
}

@Injectable()
export class DeleteFavoriOffreServiceCiviqueCommandHandler extends CommandHandler<
  DeleteFavoriOffreServiceCiviqueCommand,
  void
> {
  constructor(
    @Inject(FavorisOffresServiceCiviqueRepositoryToken)
    private readonly offreServiceCiviqueRepository: Offre.Favori.ServiceCivique.Repository,
    private readonly favoriOffreEngagementAuthorizer: FavoriOffreServiceCiviqueAuthorizer
  ) {
    super('DeleteFavoriCommandHandler')
  }

  async handle(
    command: DeleteFavoriOffreServiceCiviqueCommand
  ): Promise<Result> {
    const favoriOffre = await this.offreServiceCiviqueRepository.get(
      command.idJeune,
      command.idOffre
    )

    if (!favoriOffre) {
      return failure(
        new NonTrouveError(
          'Favori',
          `du jeune ${command.idJeune} correspondant à l'offre ${command.idOffre}`
        )
      )
    }
    await this.offreServiceCiviqueRepository.delete(
      command.idJeune,
      command.idOffre
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteFavoriOffreServiceCiviqueCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.favoriOffreEngagementAuthorizer.autoriserLeJeunePourSonOffre(
      command.idJeune,
      command.idOffre,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
