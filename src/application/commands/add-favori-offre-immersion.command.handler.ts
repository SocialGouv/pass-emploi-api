import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'

import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { Evenement, EvenementService } from 'src/domain/evenement'
import {
  OffreImmersion,
  OffresImmersion,
  OffresImmersionRepositoryToken
} from 'src/domain/offre-immersion'

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
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('AddFavoriOffreImmersionCommandHandler')
  }

  async handle(command: AddFavoriOffreImmersionCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }

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
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_IMMERSION_SAUVEGARDEE,
      utilisateur
    )
  }
}
