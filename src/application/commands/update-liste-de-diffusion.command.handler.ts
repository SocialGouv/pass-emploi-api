import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  isFailure,
  Result
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Conseiller } from '../../domain/conseiller/conseiller'
import { ListeDeDiffusionRepositoryToken } from '../../domain/conseiller/liste-de-diffusion'
import { Evenement, EvenementService } from '../../domain/evenement'
import { AuthorizeConseillerForJeunesTransferesTemporairement } from '../authorizers/authorize-conseiller-for-jeunes-transferes'
import { AuthorizeListeDeDiffusion } from '../authorizers/authorize-liste-de-diffusion'

export interface UpdateListeDeDiffusionCommand extends Command {
  id: string
  titre: string
  idsBeneficiaires: string[]
}

@Injectable()
export class UpdateListeDeDiffusionCommandHandler extends CommandHandler<
  UpdateListeDeDiffusionCommand,
  void
> {
  constructor(
    private authorizerJeunes: AuthorizeConseillerForJeunesTransferesTemporairement,
    private authorizerListe: AuthorizeListeDeDiffusion,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private listeDeDiffusionService: Conseiller.ListeDeDiffusion.Service,
    private readonly evenementService: EvenementService
  ) {
    super('UpdateListeDeDiffusionCommandHandler')
  }

  async authorize(
    command: UpdateListeDeDiffusionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const jeunesAutorises = await this.authorizerJeunes.authorize(
      command.idsBeneficiaires,
      utilisateur
    )

    if (isFailure(jeunesAutorises)) {
      return jeunesAutorises
    }

    const listeAutorisee = await this.authorizerListe.authorize(
      command.id,
      utilisateur
    )

    if (isFailure(listeAutorisee)) {
      return listeAutorisee
    }

    return emptySuccess()
  }

  async handle(command: UpdateListeDeDiffusionCommand): Promise<Result> {
    const listeDeDiffusion = await this.listeDeDiffusionRepository.get(
      command.id
    )

    if (!listeDeDiffusion) {
      return failure(new NonTrouveError('ListeDeDiffusion'))
    }

    const listeDeDiffusionAJour = this.listeDeDiffusionService.mettreAJour(
      listeDeDiffusion,
      {
        titre: command.titre,
        idsBeneficiaires: command.idsBeneficiaires
      }
    )

    await this.listeDeDiffusionRepository.save(listeDeDiffusionAJour)

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.LISTE_DIFFUSION_MODIFIEE,
      utilisateur
    )
  }
}
