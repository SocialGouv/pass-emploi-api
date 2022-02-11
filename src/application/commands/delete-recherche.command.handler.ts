import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { RechercheNonTrouveeError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Recherche, RecherchesRepositoryToken } from '../../domain/recherche'
import { RechercheAuthorizer } from '../authorizers/authorize-recherche'

export interface DeleteRechercheCommand extends Command {
  idJeune: string
  idRecherche: string
}

@Injectable()
export class DeleteRechercheCommandHandler extends CommandHandler<
  DeleteRechercheCommand,
  void
> {
  constructor(
    @Inject(RecherchesRepositoryToken)
    private readonly rechercheRepository: Recherche.Repository,
    private readonly rechercheAuthorizer: RechercheAuthorizer
  ) {
    super('DeleteRechercheCommandHandler')
  }

  async handle(command: DeleteRechercheCommand): Promise<Result<void>> {
    const rechercheExiste = await this.rechercheRepository.getRecherche(
      command.idRecherche,
      command.idJeune
    )
    if (!rechercheExiste) {
      return failure(
        new RechercheNonTrouveeError(command.idJeune, command.idRecherche)
      )
    }
    await this.rechercheRepository.deleteRecherche(
      command.idRecherche,
      command.idJeune
    )
    return emptySuccess()
  }

  async authorize(
    command: DeleteRechercheCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.rechercheAuthorizer.authorize(
      command.idJeune,
      command.idRecherche,
      utilisateur
    )
  }

  async monitor(): Promise<void> {
    return
  }
}
