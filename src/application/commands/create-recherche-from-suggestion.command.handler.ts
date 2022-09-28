import { Inject, Injectable } from '@nestjs/common'
import { Command } from 'src/building-blocks/types/command'
import { CommandHandler } from 'src/building-blocks/types/command-handler'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import {
  Recherche,
  RecherchesRepositoryToken
} from 'src/domain/offre/recherche/recherche'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from 'src/domain/offre/recherche/suggestion/suggestion'
import { DateService } from 'src/utils/date-service'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { JeuneAuthorizer } from '../authorizers/authorize-jeune'
export interface CreateRechercheFromSuggestionCommand extends Command {
  idJeune: string
  idSuggestion: string
}

@Injectable()
export class CreateRechercheFromSuggestionCommandHandler extends CommandHandler<
  CreateRechercheFromSuggestionCommand,
  void
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository,
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    private rechercheFactory: Recherche.Factory,
    private dateService: DateService
  ) {
    super('CreateRechercheFromSuggestionCommandHandler')
  }

  async handle(
    command: CreateRechercheFromSuggestionCommand
  ): Promise<Result<void>> {
    const suggestion = await this.suggestionRepository.findByIdAndIdJeune(
      command.idSuggestion,
      command.idJeune
    )

    if (!suggestion) {
      return failure(new NonTrouveError('Suggestion', command.idSuggestion))
    }

    const maintenant = this.dateService.now()
    const recherche = this.rechercheFactory.buildRechercheFromSuggestion(
      suggestion,
      maintenant
    )

    await this.rechercheRepository.save(recherche)
    await this.suggestionRepository.save({
      ...suggestion,
      dateCreationRecherche: maintenant
    })

    return emptySuccess()
  }

  async monitor(_utilisateur: Authentification.Utilisateur): Promise<void> {
    return
  }

  async authorize(
    query: CreateRechercheFromSuggestionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.authorize(query.idJeune, utilisateur)
  }
}
