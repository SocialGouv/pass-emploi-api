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
  OffreEmploi,
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { Evenement, EvenementService } from 'src/domain/evenement'

export interface AddFavoriOffreEmploiCommand extends Command {
  idJeune: string
  offreEmploi: OffreEmploi
}

@Injectable()
export class AddFavoriOffreEmploiCommandHandler extends CommandHandler<
  AddFavoriOffreEmploiCommand,
  void
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: OffresEmploi.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super()
  }

  async handle(command: AddFavoriOffreEmploiCommand): Promise<Result<void>> {
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

  async authorize(
    command: AddFavoriOffreEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_EMPLOI_SAUVEGARDEE,
      utilisateur
    )
  }
}
