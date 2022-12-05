import { Inject } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { MauvaiseCommandeError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Jeune, JeunesRepositoryToken } from '../../domain/jeune/jeune'
import { Recherche } from '../../domain/offre/recherche/recherche'
import {
  SuggestionsRepositoryToken,
  Suggestion
} from '../../domain/offre/recherche/suggestion/suggestion'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import { Evenement, EvenementService } from '../../domain/evenement'

export interface CreateSuggestionConseillerImmersionCommand extends Command {
  idConseiller: string
  idsJeunes: string[]
  titre?: string
  metier?: string
  localisation: string
  criteres: Recherche.Immersion
}

export class CreateSuggestionConseillerImmersionCommandHandler extends CommandHandler<
  CreateSuggestionConseillerImmersionCommand,
  void
> {
  constructor(
    private conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository,
    private suggestionFactory: Suggestion.Factory,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private evenementService: EvenementService
  ) {
    super('CreateSuggestionDuConseillerCommandHandler')
  }

  async authorize(
    command: CreateSuggestionConseillerImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(
      command.idConseiller,
      utilisateur
    )
  }

  async handle(
    command: CreateSuggestionConseillerImmersionCommand
  ): Promise<Result<void>> {
    const jeunes = await this.jeuneRepository.findAllJeunesByConseiller(
      command.idsJeunes,
      command.idConseiller
    )
    if (jeunes.length !== command.idsJeunes.length) {
      return failure(
        new MauvaiseCommandeError('La liste des jeunes est incorrecte')
      )
    }

    for (const jeune of jeunes) {
      const suggestion: Suggestion =
        this.suggestionFactory.creerSuggestionConseiller(
          Recherche.Type.OFFRES_IMMERSION,
          jeune.id,
          command.criteres,
          command.localisation,
          command.titre,
          command.metier
        )
      await this.suggestionRepository.save(suggestion)
    }
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.RECHERCHE_IMMERSION_SUGGEREE,
      utilisateur
    )
  }
}
