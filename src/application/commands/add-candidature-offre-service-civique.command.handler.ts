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
import { FavorisOffresServiceCiviqueRepositoryToken } from '../../domain/offre/favori/offre-service-civique'
import { Offre } from '../../domain/offre/offre'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

export interface AddCandidatureOffreServiceCiviqueCommand extends Command {
  idBeneficiaire: string
  idOffre: string
}

@Injectable()
export class AddCandidatureOffreServiceCiviqueCommandHandler extends CommandHandler<
  AddCandidatureOffreServiceCiviqueCommand,
  void
> {
  constructor(
    @Inject(FavorisOffresServiceCiviqueRepositoryToken)
    private readonly offresServiceCiviqueRepository: Offre.Favori.ServiceCivique.Repository,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly dateService: DateService,
    private readonly evenementService: EvenementService
  ) {
    super('AddCandidatureOffreServiceCiviqueCommandHandler')
  }

  async handle(
    command: AddCandidatureOffreServiceCiviqueCommand
  ): Promise<Result> {
    const favori = await this.offresServiceCiviqueRepository.get(
      command.idBeneficiaire,
      command.idOffre
    )
    if (!favori) {
      return failure(
        new NonTrouveError(
          'Favori',
          'pour l’offre de service civique ' + command.idOffre
        )
      )
    }

    const favoriAvecCandidature = Offre.Favori.postuler(
      favori,
      this.dateService.now()
    )

    await this.offresServiceCiviqueRepository.save(favoriAvecCandidature)
    return emptySuccess()
  }

  async authorize(
    command: AddCandidatureOffreServiceCiviqueCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      command.idBeneficiaire,
      utilisateur
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.OFFRE_SERVICE_CIVIQUE_CANDIDATURE_CONFIRMEE,
      utilisateur
    )
  }
}
