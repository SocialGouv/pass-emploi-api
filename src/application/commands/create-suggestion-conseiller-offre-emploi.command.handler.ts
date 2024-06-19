import { Inject } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError
} from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure
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

export interface CreateSuggestionConseillerOffreEmploiCommand extends Command {
  idConseiller: string
  idsJeunes: string[]
  titre?: string
  metier?: string
  localisation: string
  criteres: Recherche.Emploi
}

export class CreateSuggestionConseillerOffreEmploiCommandHandler extends CommandHandler<
  CreateSuggestionConseillerOffreEmploiCommand,
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
    command: CreateSuggestionConseillerOffreEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    if (
      !aAccesAuxAlternancesEtServicesCiviques(utilisateur.structure) &&
      command.criteres.alternance
    ) {
      return failure(new DroitsInsuffisants())
    }
    return this.conseillerAuthorizer.autoriserLeConseiller(
      command.idConseiller,
      utilisateur
    )
  }

  async handle(
    command: CreateSuggestionConseillerOffreEmploiCommand
  ): Promise<Result<void>> {
    if (command.criteres.commune && command.criteres.departement) {
      return failure(
        new MauvaiseCommandeError(
          "Il n'est pas possible de suggérer une offre d'emploi avec une commune et un département"
        )
      )
    }

    const jeunes = await this.jeuneRepository.findAllJeunesByIdsAndConseiller(
      command.idsJeunes,
      command.idConseiller
    )
    if (jeunes.length !== command.idsJeunes.length) {
      return failure(
        new MauvaiseCommandeError('La liste des jeunes est incorrecte')
      )
    }

    const type = command.criteres.alternance
      ? Recherche.Type.OFFRES_ALTERNANCE
      : Recherche.Type.OFFRES_EMPLOI

    for (const jeune of jeunes) {
      const suggestion: Suggestion =
        this.suggestionFactory.creerSuggestionConseiller(
          type,
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

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateSuggestionConseillerOffreEmploiCommand
  ): Promise<void> {
    await this.evenementService.creer(
      command.criteres.alternance
        ? Evenement.Code.RECHERCHE_ALTERNANCE_SUGGEREE
        : Evenement.Code.RECHERCHE_EMPLOI_SUGGEREE,
      utilisateur
    )
  }
}
