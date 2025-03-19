import { Inject, Injectable } from '@nestjs/common'
import { DateService } from 'src/utils/date-service'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { FavoriExisteDejaError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { FavorisOffresEmploiRepositoryToken } from '../../domain/offre/favori/offre-emploi'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { Offre } from '../../domain/offre/offre'

export interface AddFavoriOffreEmploiCommand extends Command {
  idJeune: string
  offreEmploi: Offre.Favori.Emploi
  aPostule: boolean
}

@Injectable()
export class AddFavoriOffreEmploiCommandHandler extends CommandHandler<
  AddFavoriOffreEmploiCommand,
  void
> {
  constructor(
    @Inject(FavorisOffresEmploiRepositoryToken)
    private offresEmploiRepository: Offre.Favori.Emploi.Repository,
    private jeuneAuthorizer: JeuneAuthorizer,
    private evenementService: EvenementService,
    private readonly dateService: DateService
  ) {
    super('AddFavoriOffreEmploiCommandHandler')
  }

  async handle(command: AddFavoriOffreEmploiCommand): Promise<Result> {
    if (
      await this.offresEmploiRepository.get(
        command.idJeune,
        command.offreEmploi.id
      )
    ) {
      return failure(
        new FavoriExisteDejaError(command.idJeune, command.offreEmploi.id)
      )
    }

    const favori = Offre.Favori.build(
      command.idJeune,
      command.offreEmploi,
      command.aPostule,
      this.dateService.now()
    )

    await this.offresEmploiRepository.save(favori)
    return emptySuccess()
  }

  async authorize(
    command: AddFavoriOffreEmploiCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(command.idJeune, utilisateur)
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    { offreEmploi: { alternance }, aPostule }: AddFavoriOffreEmploiCommand
  ): Promise<void> {
    const codeEvenement = ((): Evenement.Code => {
      switch (alternance) {
        case true:
          return aPostule
            ? Evenement.Code.OFFRE_ALTERNANCE_CANDIDATURE_CONFIRMEE
            : Evenement.Code.OFFRE_ALTERNANCE_SAUVEGARDEE
        case false:
        default:
          return aPostule
            ? Evenement.Code.OFFRE_EMPLOI_CANDIDATURE_CONFIRMEE
            : Evenement.Code.OFFRE_EMPLOI_SAUVEGARDEE
      }
    })()

    await this.evenementService.creer(codeEvenement, utilisateur)
  }
}
