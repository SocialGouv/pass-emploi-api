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
import { FavorisOffresEmploiRepositoryToken } from '../../domain/offre/favori/offre-emploi'
import { Offre } from '../../domain/offre/offre'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'

export interface AddCandidatureOffreEmploiCommand extends Command {
  idBeneficiaire: string
  idOffre: string
}

@Injectable()
export class AddCandidatureOffreEmploiCommandHandler extends CommandHandler<
  AddCandidatureOffreEmploiCommand,
  void
> {
  constructor(
    @Inject(FavorisOffresEmploiRepositoryToken)
    private offresEmploiRepository: Offre.Favori.Emploi.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private readonly dateService: DateService
  ) {
    super('AddCandidatureOffreEmploiCommandHandler')
  }

  async handle(command: AddCandidatureOffreEmploiCommand): Promise<Result> {
    const favori = await this.offresEmploiRepository.get(
      command.idBeneficiaire,
      command.idOffre
    )
    if (!favori) {
      return failure(
        new NonTrouveError('Favori', 'pour l’offre d’emploi ' + command.idOffre)
      )
    }

    const favoriAvecCandidature = Offre.Favori.postuler(
      favori,
      this.dateService.now()
    )

    await this.offresEmploiRepository.save(favoriAvecCandidature)
    return emptySuccess()
  }

  async authorize(
    command: AddCandidatureOffreEmploiCommand,
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
