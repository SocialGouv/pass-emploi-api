import { Body, Controller, Param, Post } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../application/commands/create-liste-de-diffusion.command.handler'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { CreateListeDeDiffusionPayload } from './validation/conseillers.inputs'

@Controller('conseillers/:idConseiller/listes-de-diffusion')
@ApiOAuth2([])
@ApiTags('Listes de diffusion')
export class ConseillersController {
  constructor(
    private readonly createListeDeDiffusionCommandHandler: CreateListeDeDiffusionCommandHandler
  ) {}

  @ApiOperation({
    summary: 'Crée une liste de diffusion',
    description:
      'Autorisé pour le conseiller avec les bénéficiaires de son portefeuille.'
  })
  @Post()
  async getListesDeDiffusion(
    @Param('idConseiller') idConseiller: string,
    @Body() payload: CreateListeDeDiffusionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateListeDeDiffusionCommand = {
      idConseiller,
      titre: payload.titre,
      idsBeneficiaires: payload.idsBeneficiaires
    }
    const result = await this.createListeDeDiffusionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }
  }
}
