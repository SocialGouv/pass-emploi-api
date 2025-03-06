import { Inject, Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
import { Evenement, EvenementService } from '../../domain/evenement'
import { FavorisOffresImmersionRepositoryToken } from '../../domain/offre/favori/offre-immersion'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { FavoriExisteDejaError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { Offre } from '../../domain/offre/offre'

export interface AddFavoriOffreImmersionCommand extends Command {
  idJeune: string
  offreImmersion: Offre.Favori.Immersion
  aPostule: boolean
}

@Injectable()
export class AddFavoriOffreImmersionCommandHandler extends CommandHandler<
  AddFavoriOffreImmersionCommand,
  void
> {
  constructor(
    @Inject(FavorisOffresImmersionRepositoryToken)
    private offresImmersionRepository: Offre.Favori.Immersion.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService,
    private readonly dateService: DateService
  ) {
    super('AddFavoriOffreImmersionCommandHandler')
  }

  async handle(command: AddFavoriOffreImmersionCommand): Promise<Result> {
    const favori = await this.offresImmersionRepository.get(
      command.idJeune,
      command.offreImmersion.id
    )
    if (favori) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offreImmersion.id)
      )
    }

    const nouveauFavori = Offre.Favori.build(
      command.idJeune,
      command.offreImmersion,
      command.aPostule,
      this.dateService.now()
    )

    await this.offresImmersionRepository.save(nouveauFavori)

    return emptySuccess()
  }

  async authorize(
    command: AddFavoriOffreImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_IMMERSION_SAUVEGARDEE,
      utilisateur
    )
  }
}
