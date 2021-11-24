import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'

import {
  OffreEmploiListItem,
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offres-emploi'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'

export interface AddFavoriOffreEmploiCommand extends Command {
  idJeune: string
  offreEmploi: OffreEmploiListItem
}

@Injectable()
export class AddFavoriOffreEmploiCommandHandler
  implements CommandHandler<AddFavoriOffreEmploiCommand, Result>
{
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {}

  async execute(command: AddFavoriOffreEmploiCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

    if (
      await this.offresEmploiRepository.getFavori(
        command.idJeune,
        command.offreEmploi.id
      )
    ) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offreEmploi.id)
      )
    }

    await this.offresEmploiRepository.saveAsFavori(
      command.idJeune,
      command.offreEmploi
    )
    return emptySuccess()
  }
}
