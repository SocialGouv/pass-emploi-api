import { Inject, Injectable } from '@nestjs/common'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { FavorisOffresImmersionRepositoryToken } from '../../domain/offre/favori/offre-immersion'
import { Offre } from '../../domain/offre/offre'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

export interface AddCandidatureOffreImmersionCommand extends Command {
  idBeneficiaire: string
  idOffre: string
}

@Injectable()
export class AddCandidatureOffreImmersionCommandHandler extends CommandHandler<
  AddCandidatureOffreImmersionCommand,
  void
> {
  constructor(
    @Inject(FavorisOffresImmersionRepositoryToken)
    private readonly offresImmersionRepository: Offre.Favori.Immersion.Repository,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly dateService: DateService,
    private readonly evenementService: EvenementService
  ) {
    super('AddCandidatureOffreImmersionCommandHandler')
  }

  async handle(command: AddCandidatureOffreImmersionCommand): Promise<Result> {
    const favori = await this.offresImmersionRepository.get(
      command.idBeneficiaire,
      command.idOffre
    )
    if (!favori) {
      return failure(
        new NonTrouveError(
          'Favori',
          'pour l’offre d’immersion ' + command.idOffre
        )
      )
    }

    const favoriAvecCandidature = Offre.Favori.postuler(
      favori,
      this.dateService.now()
    )

    await this.offresImmersionRepository.save(favoriAvecCandidature)
    return emptySuccess()
  }

  async authorize(
    command: AddCandidatureOffreImmersionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      command.idBeneficiaire,
      utilisateur
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_IMMERSION_CANDIDATURE_CONFIRMEE,
      utilisateur
    )
  }
}
