import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Recherche, RecherchesRepositoryToken } from '../../domain/recherche'
import { RechercheAuthorizer } from '../authorizers/authorize-recherche'
import { NonTrouveError } from '../../building-blocks/types/domain-error'

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
      command.idRecherche
    )
    if (!rechercheExiste) {
      return failure(new NonTrouveError('Recherche', command.idRecherche))
    }
    await this.rechercheRepository.deleteRecherche(command.idRecherche)
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
