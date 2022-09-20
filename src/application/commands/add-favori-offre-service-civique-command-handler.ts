import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { FavoriExisteDejaError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { OffreServiceCiviqueRepositoryToken } from '../../domain/offre/favori/offre-service-civique'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
import { Offre } from '../../domain/offre/offre'

export interface AddFavoriServiceCiviqueCommand extends Command {
  idJeune: string
  offre: Offre.Favori.ServiceCivique
}

@Injectable()
export class AddFavoriOffreServiceCiviqueCommandHandler extends CommandHandler<
  AddFavoriServiceCiviqueCommand,
  void
> {
  constructor(
    @Inject(OffreServiceCiviqueRepositoryToken)
    private offreServiceCiviqueRepository: Offre.Favori.ServiceCivique.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('AddFavoriOffreEngagementCommandHandler')
  }

  async handle(command: AddFavoriServiceCiviqueCommand): Promise<Result> {
    const favori = await this.offreServiceCiviqueRepository.get(
      command.idJeune,
      command.offre.id
    )

    if (favori) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offre.id)
      )
    }

    await this.offreServiceCiviqueRepository.save(
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
    await this.evenementService.creer(
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_SAUVEGARDEE,
      utilisateur
    )
  }
}
