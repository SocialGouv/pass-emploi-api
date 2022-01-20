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
  OffreEmploi,
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'

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
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('AddFavoriOffreEmploiCommandHandler')
  }

  async handle(command: AddFavoriOffreEmploiCommand): Promise<Result> {
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

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: AddFavoriOffreEmploiCommand
  ): Promise<void> {
    const evenementType =
      command.offreEmploi.alternance === true
        ? Evenement.Type.OFFRE_ALTERNANCE_SAUVEGARDEE
        : Evenement.Type.OFFRE_EMPLOI_SAUVEGARDEE
    await this.evenementService.creerEvenement(evenementType, utilisateur)
  }
}
