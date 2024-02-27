import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { FavorisOffresImmersionRepositoryToken } from '../../domain/offre/favori/offre-immersion'
import { Offre } from '../../domain/offre/offre'
import { FavoriOffresImmersionAuthorizer } from '../authorizers/favori-offres-immersion-authorizer'

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
    @Inject(FavorisOffresImmersionRepositoryToken)
    private readonly offresImmersionRepository: Offre.Favori.Immersion.Repository,
    private readonly favoriOffresImmersionAuthorizer: FavoriOffresImmersionAuthorizer
  ) {
    super('DeleteFavoriCommandHandler')
  }

  async handle(
    command: DeleteFavoriOffreImmersionCommand
  ): Promise<Result<void>> {
    const favoriOffreEmploi = await this.offresImmersionRepository.get(
      command.idJeune,
      command.idOffreImmersion
    )
    if (!favoriOffreEmploi) {
      return failure(
        new NonTrouveError(
          'Favori',
          `du jeune ${command.idJeune} correspondant à l'offre ${command.idOffreImmersion}`
        )
      )
    }
    await this.offresImmersionRepository.delete(
      command.idJeune,
      command.idOffreImmersion
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteFavoriOffreImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.favoriOffresImmersionAuthorizer.autoriserLeJeunePourSonOffre(
      command.idJeune,
      command.idOffreImmersion,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
