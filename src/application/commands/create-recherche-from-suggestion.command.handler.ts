import { Inject, Injectable } from '@nestjs/common'
import { DiagorienteLocation } from 'src/domain/offre/recherche/suggestion/diagoriente'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import { Result, failure, isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { EvenementService } from '../../domain/evenement'
import {
  Recherche,
  RecherchesRepositoryToken
} from '../../domain/offre/recherche/recherche'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'
import { SuggestionAuthorizer } from '../authorizers/suggestion-authorizer'

export interface CreateRechercheFromSuggestionCommand extends Command {
  idJeune: string
  idSuggestion: string
  location?: DiagorienteLocation
  rayon?: number
}

@Injectable()
export class CreateRechercheFromSuggestionCommandHandler extends CommandHandler<
  CreateRechercheFromSuggestionCommand,
  Recherche
> {
  constructor(
    private suggestionAuthorizer: SuggestionAuthorizer,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository,
    @Inject(RecherchesRepositoryToken)
    private rechercheRepository: Recherche.Repository,
    private rechercheFactory: Recherche.Factory,
    private suggestionFactory: Suggestion.Factory,
    private evenementService: EvenementService
  ) {
    super('CreateRechercheFromSuggestionCommandHandler')
  }

  async handle(
    command: CreateRechercheFromSuggestionCommand
  ): Promise<Result<Recherche>> {
    let suggestion = await this.suggestionRepository.get(command.idSuggestion)

    if (!suggestion) {
      return failure(new MauvaiseCommandeError('Suggestion non trouvée'))
    }
    if (suggestion.source === Suggestion.Source.DIAGORIENTE) {
      if (!command.location) {
        return failure(
          new MauvaiseCommandeError(
            'La localisation est nécessaire pour une suggestion DIAGORIENTE'
          )
        )
      }
      const criteresDiagoriente =
        this.suggestionFactory.construireCriteresSuggestionsDiagoriente(
          suggestion,
          { location: command.location, rayon: command.rayon ?? undefined }
        )

      suggestion = {
        ...suggestion,
        informations: {
          ...suggestion.informations,
          localisation: command.location.libelle
        },
        criteres: criteresDiagoriente
      }
    }

    const suggestionAccepteeResult = this.suggestionFactory.accepter(suggestion)
    if (isFailure(suggestionAccepteeResult)) {
      return suggestionAccepteeResult
    }

    const rechercheResult = this.rechercheFactory.buildRechercheFromSuggestion(
      suggestionAccepteeResult.data
    )
    if (isFailure(rechercheResult)) {
      return rechercheResult
    }

    await this.rechercheRepository.save(rechercheResult.data)
    await this.suggestionRepository.save(suggestionAccepteeResult.data)

    return rechercheResult
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateRechercheFromSuggestionCommand
  ): Promise<void> {
    await this.evenementService.creerEvenementSuggestion(
      utilisateur,
      command.idSuggestion
    )
  }

  async authorize(
    command: CreateRechercheFromSuggestionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.suggestionAuthorizer.autoriserJeunePourSaSuggestion(
      command.idJeune,
      command.idSuggestion,
      utilisateur
    )
  }
}
