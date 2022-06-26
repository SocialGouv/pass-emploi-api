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
  OffreServiceCiviqueRepositoryToken,
  OffreServiceCivique
} from '../../domain/offre-service-civique'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

export interface AddFavoriServiceCiviqueCommand extends Command {
  idJeune: string
  offre: OffreServiceCivique
}

@Injectable()
export class AddFavoriOffreServiceCiviqueCommandHandler extends CommandHandler<
  AddFavoriServiceCiviqueCommand,
  void
> {
  constructor(
    @Inject(OffreServiceCiviqueRepositoryToken)
    private offreServiceCiviqueRepository: OffreServiceCivique.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('AddFavoriOffreEngagementCommandHandler')
  }

  async handle(command: AddFavoriServiceCiviqueCommand): Promise<Result> {
    const favori = await this.offreServiceCiviqueRepository.getFavori(
      command.idJeune,
      command.offre.id
    )

    if (favori) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offre.id)
      )
    }

    await this.offreServiceCiviqueRepository.saveAsFavori(
      command.idJeune,
      command.offre
    )

    return emptySuccess()
  }

  async authorize(
    command: AddFavoriServiceCiviqueCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE,
      utilisateur
    )
  }
}
