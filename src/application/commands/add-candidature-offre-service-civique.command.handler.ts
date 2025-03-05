import { Inject, Injectable } from '@nestjs/common'
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
    private offresServiceCiviqueRepository: Offre.Favori.ServiceCivique.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private readonly dateService: DateService
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

  async monitor(): Promise<void> {
    // TODO ?
  }
}
