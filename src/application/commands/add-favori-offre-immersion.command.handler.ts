import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../domain/evenement'
import {
  OffreImmersion,
  OffresImmersion,
  OffresImmersionRepositoryToken
} from '../../domain/offre-immersion'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { FavoriExisteDejaError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface AddFavoriOffreImmersionCommand extends Command {
  idJeune: string
  offreImmersion: OffreImmersion
}

@Injectable()
export class AddFavoriOffreImmersionCommandHandler extends CommandHandler<
  AddFavoriOffreImmersionCommand,
  void
> {
  constructor(
    @Inject(OffresImmersionRepositoryToken)
    private offresImmersionRepository: OffresImmersion.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('AddFavoriOffreImmersionCommandHandler')
  }

  async handle(command: AddFavoriOffreImmersionCommand): Promise<Result> {
    const favori = await this.offresImmersionRepository.getFavori(
      command.idJeune,
      command.offreImmersion.id
    )

    if (favori) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offreImmersion.id)
      )
    }

    await this.offresImmersionRepository.saveAsFavori(
      command.idJeune,
      command.offreImmersion
    )

    return emptySuccess()
  }

  async authorize(
    command: AddFavoriOffreImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_IMMERSION_SAUVEGARDEE,
      utilisateur
    )
  }
}
