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
import { aAccesAuxAlternancesEtServicesCiviques } from '../../domain/core'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Jeune, JeuneRepositoryToken } from '../../domain/jeune/jeune'
import { Recherche } from '../../domain/offre/recherche/recherche'
import {
  Suggestion,
  SuggestionsRepositoryToken
} from '../../domain/offre/recherche/suggestion/suggestion'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'

export interface CreateSuggestionConseillerServiceCiviqueCommand
  extends Command {
  idConseiller: string
  idsJeunes: string[]
  titre?: string
  metier?: string
  localisation: string
  criteres: Recherche.ServiceCivique
}

export class CreateSuggestionConseillerServiceCiviqueCommandHandler extends CommandHandler<
  CreateSuggestionConseillerServiceCiviqueCommand,
  void
> {
  constructor(
    private conseillerAuthorizer: ConseillerAuthorizer,
    @Inject(SuggestionsRepositoryToken)
    private suggestionRepository: Suggestion.Repository,
    private suggestionFactory: Suggestion.Factory,
    @Inject(JeuneRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private evenementService: EvenementService
  ) {
    super('CreateSuggestionDuConseillerCommandHandler')
  }

  async authorize(
    command: CreateSuggestionConseillerServiceCiviqueCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur,
      aAccesAuxAlternancesEtServicesCiviques(utilisateur.structure)
    )
  }

  async handle(
    command: CreateSuggestionConseillerServiceCiviqueCommand
  ): Promise<Result<void>> {
    const jeunes = await this.jeuneRepository.findAllJeunesByIdsAndConseiller(
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
          Recherche.Type.OFFRES_SERVICES_CIVIQUE,
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
      Evenement.Code.RECHERCHE_SERVICE_CIVIQUE_SUGGEREE,
      utilisateur
    )
  }
}
