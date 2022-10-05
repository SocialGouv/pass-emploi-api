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
import { SuggestionsRepositoryToken } from '../../domain/offre/recherche/suggestion/suggestion'
import { ConseillerAuthorizer } from '../authorizers/authorize-conseiller'
import Suggestion = Recherche.Suggestion

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
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository
  ) {
    super('CreateSuggestionDuConseillerCommandHandler')
  }

  async authorize(
    command: CreateSuggestionConseillerOffreEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.conseillerAuthorizer.authorize(
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
          Recherche.Type.OFFRES_EMPLOI,
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

  async monitor(): Promise<void> {
    return
  }
}
