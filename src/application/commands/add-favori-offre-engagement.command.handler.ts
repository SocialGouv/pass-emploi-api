import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { FavoriExisteDejaError } from '../../building-blocks/types/domain-error'
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
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface AddFavoriOffreEngagementCommand extends Command {
  idJeune: string
  offre: OffreEngagement
}

@Injectable()
export class AddFavoriOffreEngagementCommandHandler extends CommandHandler<
  AddFavoriOffreEngagementCommand,
  void
> {
  constructor(
    @Inject(EngagementRepositoryToken)
    private offreEngagementRepository: OffreEngagement.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('AddFavoriOffreEngagementCommandHandler')
  }

  async handle(command: AddFavoriOffreEngagementCommand): Promise<Result> {
    const favori = await this.offreEngagementRepository.getFavori(
      command.idJeune,
      command.offre.id
    )

    if (favori) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offre.id)
      )
    }

    await this.offreEngagementRepository.saveAsFavori(
      command.idJeune,
      command.offre
    )

    return emptySuccess()
  }

  async authorize(
    command: AddFavoriOffreEngagementCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE,
      utilisateur
    )
  }
}
