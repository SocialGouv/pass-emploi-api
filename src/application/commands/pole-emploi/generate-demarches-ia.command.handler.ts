import { Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { Command } from '../../../building-blocks/types/command'
import { CommandHandler } from '../../../building-blocks/types/command-handler'
import {
  Result,
  isFailure,
  success
} from '../../../building-blocks/types/result'
import { Authentification } from '../../../domain/authentification'
import { beneficiaireEstFTConnect } from '../../../domain/core'
import { PoleEmploiClient } from '../../../infrastructure/clients/pole-emploi-client'
import { JeuneAuthorizer } from '../../authorizers/jeune-authorizer'
import { Evenement, EvenementService } from '../../../domain/evenement'

export class DemarcheIAQueryModel {
  @ApiProperty()
  description: string
  @ApiProperty()
  codePourquoi: string
  @ApiProperty()
  codeQuoi: string
}

export interface GenerateDemarchesIACommand extends Command {
  contenu: string
  idJeune: string
}

@Injectable()
export class GenerateDemarchesIACommandHandler extends CommandHandler<
  GenerateDemarchesIACommand,
  DemarcheIAQueryModel[]
> {
  constructor(
    private jeuneAuthorizer: JeuneAuthorizer,
    private readonly poleEmploiClient: PoleEmploiClient,
    private evenementService: EvenementService
  ) {
    super('GenerateDemarchesIACommandHandler')
  }

  async authorize(
    command: GenerateDemarchesIACommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      command.idJeune,
      utilisateur,
      beneficiaireEstFTConnect(utilisateur.structure)
    )
  }

  async handle(
    command: GenerateDemarchesIACommand,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result<DemarcheIAQueryModel[]>> {
    const result = await this.poleEmploiClient.generateDemarchesIA(
      command.contenu
    )
    if (isFailure(result)) {
      return result
    }

    for (const _demarche of result.data) {
      await this.evenementService.creer(
        Evenement.Code.SUGGESTION_IA,
        utilisateur
      )
    }

    return success(result.data)
  }

  async monitor(_utilisateur: Authentification.Utilisateur): Promise<void> {}
}
