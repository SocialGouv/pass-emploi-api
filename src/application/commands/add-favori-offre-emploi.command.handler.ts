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
import { OffresEmploiRepositoryToken } from '../../domain/offre/favori/offre-emploi'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { Offre } from '../../domain/offre/offre'

export interface AddFavoriOffreEmploiCommand extends Command {
  idJeune: string
  offreEmploi: Offre.Favori.Emploi
}

@Injectable()
export class AddFavoriOffreEmploiCommandHandler extends CommandHandler<
  AddFavoriOffreEmploiCommand,
  void
> {
  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private offresEmploiRepository: Offre.Favori.Emploi.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService
  ) {
    super('AddFavoriOffreEmploiCommandHandler')
  }

  async handle(command: AddFavoriOffreEmploiCommand): Promise<Result> {
    if (
      await this.offresEmploiRepository.get(
        command.idJeune,
        command.offreEmploi.id
      )
    ) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offreEmploi.id)
      )
    }

    await this.offresEmploiRepository.save(command.idJeune, command.offreEmploi)
    return emptySuccess()
  }

  async authorize(
    command: AddFavoriOffreEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: AddFavoriOffreEmploiCommand
  ): Promise<void> {
    const evenementType =
      command.offreEmploi.alternance === true
        ? Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE
        : Evenement.Code.OFFRE_EMPLOI_SAUVEGARDEE
    await this.evenementService.creer(evenementType, utilisateur)
  }
}
