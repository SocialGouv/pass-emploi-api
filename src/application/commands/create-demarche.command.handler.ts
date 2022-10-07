import { Command } from '../../building-blocks/types/command'
import { CommandHandler } from '../../building-blocks/types/command-handler'
import { isFailure, Result } from '../../building-blocks/types/result'
import { Inject, Injectable } from '@nestjs/common'
import { Authentification } from '../../domain/authentification'
import { JeunePoleEmploiAuthorizer } from '../authorizers/authorize-jeune-pole-emploi'
import { Evenement, EvenementService } from '../../domain/evenement'
import { Demarche, DemarcheRepositoryToken } from '../../domain/demarche'
import { DateTime } from 'luxon'

export interface CreateDemarcheCommand extends Command {
  idJeune: string
  accessToken: string
  description?: string
  codeQuoi?: string
  codePourquoi?: string
  codeComment?: string
  dateFin: DateTime
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
  ): Promise<Result> {
    return this.jeunePoleEmploiAuthorizer.authorize(
      command.idJeune,
      utilisateur
    )
  }

  async handle(command: CreateDemarcheCommand): Promise<Result<Demarche>> {
    const demarcheACreer: Demarche.ACreer = {
      dateFin: command.dateFin,
      description: command.description,
      comment: command.codeComment,
      quoi: command.codeQuoi,
      pourquoi: command.codePourquoi
    }
    const result = this.demarcheFactory.creerDemarche(demarcheACreer)

    if (isFailure(result)) {
      return result
    }

    return this.demarcheRepository.save(result.data, command.accessToken)
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(Evenement.Code.ACTION_CREEE, utilisateur)
  }
}
