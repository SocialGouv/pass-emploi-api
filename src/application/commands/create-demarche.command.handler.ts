import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { Result } from '../../building-blocks/types/result'
import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Demarche, DemarcheRepositoryToken } from '../../domain/demarche'

export interface CreateDemarcheCommand extends Command {
  idJeune: string
  accessToken: string
  description: string
  dateFin: Date
}

@Injectable()
export class CreateDemarcheCommandHandler extends CommandHandler<
  CreateDemarcheCommand,
  Demarche
> {
  constructor(
    private jeunePoleEmploiAuthorizer: JeunePoleEmploiAuthorizer,
    private evenementService: EvenementService,
    private demarcheFactory: Demarche.Factory,
    @Inject(DemarcheRepositoryToken)
    private demarcheRepository: Demarche.Repository
  ) {
    super('CreateDemarcheCommandHandler')
  }

  async authorize(
    command: CreateDemarcheCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    await this.jeunePoleEmploiAuthorizer.authorize(command.idJeune, utilisateur)
  }

  async handle(command: CreateDemarcheCommand): Promise<Result<Demarche>> {
    const nouvelleDemarchePerso = this.demarcheFactory.creerDemarchePerso(
      command.description,
      command.dateFin
    )
    return this.demarcheRepository.save(
      nouvelleDemarchePerso,
      command.accessToken
    )
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creerEvenement(
      Evenement.Type.DEMARCHE_CREEE,
      utilisateur
    )
  }
}
