import { Inject, Injectable } from '@nestjs/common'
import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import {
  Result,
  emptySuccess,
  failure,
  isFailure
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Conseiller } from '../../domain/milo/conseiller'
import { ListeDeDiffusionRepositoryToken } from '../../domain/milo/liste-de-diffusion'
import { ConseillerAuthorizer } from '../authorizers/conseiller-authorizer'
import { ListeDeDiffusionAuthorizer } from '../authorizers/liste-de-diffusion-authorizer'
import { ListeDeDiffusionJeuneAssociationSqlModel } from '../../infrastructure/sequelize/models/liste-de-diffusion-jeune-association.sql-model'
import { DateService } from '../../utils/date-service'

export interface AjouterJeuneListeDeDiffusionCommand extends Command {
  idConseiller: string
  idJeune: string
  idListeDeDiffusion: string
}

@Injectable()
export class AjouterJeuneListeDeDiffusionCommandHandler extends CommandHandler<
  AjouterJeuneListeDeDiffusionCommand,
  void
> {
  constructor(
    private conseillerAuthorizer: ConseillerAuthorizer,
    private listeAuthorizer: ListeDeDiffusionAuthorizer,
    @Inject(ListeDeDiffusionRepositoryToken)
    private listeDeDiffusionRepository: Conseiller.ListeDeDiffusion.Repository,
    private dateService: DateService,
    private readonly evenementService: EvenementService
  ) {
    super('AjouterJeuneListeDeDiffusionCommandHandler')
  }

  async authorize(
    command: AjouterJeuneListeDeDiffusionCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    const resultAuthorizationLDD =
      await this.listeAuthorizer.autoriserConseillerPourSaListeDeDiffusion(
        command.idListeDeDiffusion,
        utilisateur
      )
    if (isFailure(resultAuthorizationLDD)) {
      return resultAuthorizationLDD
    }
    return this.conseillerAuthorizer.autoriserLeConseillerPourSonJeune(
      command.idConseiller,
      command.idJeune,
      utilisateur
    )
  }

  async handle(command: AjouterJeuneListeDeDiffusionCommand): Promise<Result> {
    const listeDeDiffusion = await this.listeDeDiffusionRepository.get(
      command.idListeDeDiffusion
    )

    if (!listeDeDiffusion) {
      return failure(new NonTrouveError('ListeDeDiffusion'))
    }

    await ListeDeDiffusionJeuneAssociationSqlModel.create({
      idBeneficiaire: command.idJeune,
      idListe: listeDeDiffusion.id,
      dateAjout: this.dateService.now().toJSDate()
    })

    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.LISTE_DIFFUSION_MODIFIEE,
      utilisateur
    )
  }
}
