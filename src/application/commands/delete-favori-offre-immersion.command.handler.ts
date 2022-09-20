import { Inject, Injectable } from '@nestjs/common'
import { Offre } from 'src/domain/offre/offre'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { FavoriNonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { OffresImmersionRepositoryToken } from '../../domain/offre/favori/offre-immersion'
import { FavoriOffresImmersionAuthorizer } from '../authorizers/authorize-favori-offres-immersion'

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
        new FavoriNonTrouveError(command.idJeune, command.idOffreImmersion)
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
    return this.favoriOffresImmersionAuthorizer.authorize(
      command.idJeune,
      command.idOffreImmersion,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
