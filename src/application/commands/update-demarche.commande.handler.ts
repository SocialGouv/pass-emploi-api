import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Result } from '../../building-blocks/types/result'
import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Demarche, DemarcheRepositoryToken } from '../../domain/demarche'

export interface UpdateDemarcheCommand extends Command {
  idJeune: string
  accessToken: string
  demarcheInitiale: Demarche
  statut?: Demarche.Statut
}

@Injectable()
export class UpdateDemarcheCommandHandler extends CommandHandler<
  UpdateDemarcheCommand,
  Demarche
> {
  constructor(
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private evenementService: EvenementService,
    private demarcheFactory: Demarche.Factory,
    @Inject(DemarcheRepositoryToken)
    private demarcheRepository: Demarche.Repository
  ) {
    super('UpdateDemarcheCommandHandler')
  }

  async authorize(
    command: UpdateDemarcheCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeunePoleEmploiAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async handle(command: UpdateDemarcheCommand): Promise<Result<Demarche>> {
    const demarche = this.demarcheFactory.mettreAJourLeStatut(
      command.demarcheInitiale,
      command.statut!
    )
    return this.demarcheRepository.update(demarche, command.accessToken)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.DEMARCHE_MODIFIEE,
      utilisateur
    )
  }
}
