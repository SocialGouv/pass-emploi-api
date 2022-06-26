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
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'
import { FavoriOffresEmploiAuthorizer } from '../authorizers/authorize-favori-offres-emploi'

export interface DeleteFavoriOffreEmploiCommand extends Command {
  idOffreEmploi: string
  idJeune: string
}

@Injectable()
export class DeleteFavoriOffreEmploiCommandHandler extends CommandHandler<
  DeleteFavoriOffreEmploiCommand,
  void
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private readonly offresEmploiRepository: OffresEmploi.Repository,
    private readonly favoriOffresEmploiAuthorizer: FavoriOffresEmploiAuthorizer
  ) {
    super('DeleteFavoriCommandHandler')
  }

  async handle(command: DeleteFavoriOffreEmploiCommand): Promise<Result<void>> {
    const favoriOffreEmploi = await this.offresEmploiRepository.getFavori(
      command.idJeune,
      command.idOffreEmploi
    )
    if (!favoriOffreEmploi) {
      return failure(
        new FavoriNonTrouveError(command.idJeune, command.idOffreEmploi)
      )
    }
    await this.offresEmploiRepository.deleteFavori(
      command.idJeune,
      command.idOffreEmploi
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteFavoriOffreEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.favoriOffresEmploiAuthorizer.authorize(
      command.idJeune,
      command.idOffreEmploi,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
