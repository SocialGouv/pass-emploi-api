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
  void,
  Offre.Favori<Offre.Favori.Emploi> | undefined
> {
  constructor(
    @Inject(FavorisOffresEmploiRepositoryToken)
    private readonly offresEmploiRepository: Offre.Favori.Emploi.Repository,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private readonly dateService: DateService,
    private readonly evenementService: EvenementService
  ) {
    super('AddCandidatureOffreEmploiCommandHandler')
  }

  async getAggregate(
    command: AddCandidatureOffreEmploiCommand
  ): Promise<Offre.Favori<Offre.Favori.Emploi> | undefined> {
    return this.offresEmploiRepository.get(
      command.idBeneficiaire,
      command.idOffre
    )
  }

  async handle(
    command: AddCandidatureOffreEmploiCommand,
    _utilisateur: Authentification.Utilisateur,
    favori: Offre.Favori<Offre.Favori.Emploi> | undefined
  ): Promise<Result> {
    if (!favori) {
      return failure(
        new NonTrouveError('Favori', 'pour l’offre d’emploi ' + command.idOffre)
      )
    }

    const dateCandidature = this.dateService.now()
    const favoriAvecCandidature = Offre.Favori.postuler(favori, dateCandidature)

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

  async monitor(
    utilisateur: Authentification.Utilisateur,
    _command: AddCandidatureOffreEmploiCommand,
    favori: Offre.Favori<Offre.Favori.Emploi>
  ): Promise<void> {
    const codeEvenement = favori.offre.alternance
      ? Evenement.Code.OFFRE_ALTERNANCE_CANDIDATURE_CONFIRMEE
      : Evenement.Code.OFFRE_EMPLOI_CANDIDATURE_CONFIRMEE

    await this.evenementService.creer(codeEvenement, utilisateur)
  }
}
