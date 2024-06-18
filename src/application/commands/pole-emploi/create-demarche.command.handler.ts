import { Inject, Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import { Result, isFailure } from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { estPoleEmploi } from '../../../domain/core'
import { Demarche, DemarcheRepositoryToken } from '../../../domain/demarche'
import { Evenement, EvenementService } from '../../../domain/evenement'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'

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
    private jeuneAuthorizer: JeuneAuthorizer,
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
    return this.jeuneAuthorizer.autoriserLeJeune(
      command.idJeune,
      utilisateur,
      estPoleEmploi(utilisateur.structure)
    )
  }

  async handle(
    command: CreateDemarcheCommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<Demarche>> {
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

    return this.demarcheRepository.save(
      result.data,
      command.accessToken,
      utilisateur.structure
    )
  }

  async monitor(
    utilisateur: Authentification.Utilisateur,
    command: CreateDemarcheCommand
  ): Promise<void> {
    if (command.description) {
      await this.evenementService.creer(
        Evenement.Code.ACTION_CREEE_HORS_REFERENTIEL,
        utilisateur
      )
    }
    if (command.codeQuoi && command.codePourquoi) {
      await this.evenementService.creer(
        Evenement.Code.ACTION_CREEE_REFERENTIEL,
        utilisateur
      )
    }
  }
}
