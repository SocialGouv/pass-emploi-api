import { Inject, Injectable, Logger } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import {
  OffresEmploi,
  OffresEmploiRepositoryToken
} from '../../domain/offre-emploi'
import {
  FavoriNonTrouveError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune'
import { FavoriAuthorizer } from '../authorizers/authorize-favori'

export interface DeleteFavoriOffreEmploiCommand extends Command {
  idOffreEmploi: string
  idJeune: string
}

@Injectable()
export class DeleteFavoriOffreEmploiCommandHandler extends CommandHandler<
  DeleteFavoriOffreEmploiCommand,
  Result
> {
  private logger: Logger

  constructor(
    @Inject(OffresEmploiRepositoryToken)
    private readonly offresEmploiRepository: OffresEmploi.Repository,
    @Inject(JeunesRepositoryToken)
    private readonly jeuneRepository: Jeune.Repository,
    private readonly favoriAuthorizer: FavoriAuthorizer
  ) {
    super()
    this.logger = new Logger('DeleteFavoriCommandHandler')
  }

  async handle(command: DeleteFavoriOffreEmploiCommand): Promise<Result> {
    const jeune = await this.jeuneRepository.get(command.idJeune)
    if (!jeune) {
      return failure(new NonTrouveError('Jeune', command.idJeune))
    }
    const favoriOffreEmploi = await this.offresEmploiRepository.getFavori(
      command.idJeune,
      command.idOffreEmploi
    )
    if (!favoriOffreEmploi) {
      return failure(
        new FavoriNonTrouveError(command.idJeune, command.idOffreEmploi)
      )
    }
    await this.offresEmploiRepository.deleteFavori(
      command.idJeune,
      command.idOffreEmploi
    )
    this.logger.log(
      `L'offre ${command.idOffreEmploi} a été supprimée des favoris du jeune ${command.idJeune}`
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteFavoriOffreEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.favoriAuthorizer.authorize(
      command.idJeune,
      command.idOffreEmploi,
      utilisateur
    )
  }
}
