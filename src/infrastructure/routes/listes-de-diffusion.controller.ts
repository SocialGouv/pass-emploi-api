import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../application/commands/create-liste-de-diffusion.command.handler'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import {
  CreateListeDeDiffusionPayload,
  UpdateListeDeDiffusionPayload
} from './validation/conseillers.inputs'
import { ListeDeDiffusionQueryModel } from '../../application/queries/query-models/liste-de-diffusion.query-model'
import { GetListesDeDiffusionDuConseillerQueryHandler } from '../../application/queries/get-listes-de-diffusion-du-conseiller.query.handler.db'
import {
  UpdateListeDeDiffusionCommand,
  UpdateListeDeDiffusionCommandHandler
} from '../../application/commands/update-liste-de-diffusion.command.handler'

@Controller('conseillers/:idConseiller/listes-de-diffusion')
@ApiOAuth2([])
@ApiTags('Listes de diffusion')
export class ListesDeDiffusionController {
  constructor(
    private readonly createListeDeDiffusionCommandHandler: CreateListeDeDiffusionCommandHandler,
    private readonly updateListeDeDiffusionCommandHandler: UpdateListeDeDiffusionCommandHandler,
    private readonly getListesDeDiffusionQueryHandler: GetListesDeDiffusionDuConseillerQueryHandler
  ) {}

  @ApiOperation({
    summary: 'Crée une liste de diffusion',
    description:
      'Autorisé pour le conseiller avec les bénéficiaires de son portefeuille.'
  })
  @Post()
  async postListesDeDiffusion(
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

  @ApiOperation({
    summary: 'Modifie une liste de diffusion',
    description:
      'Autorisé pour le conseiller avec les bénéficiaires de son portefeuille ou temporairement transférés.'
  })
  @Put(':idListeDeDiffusion')
  async putListesDeDiffusion(
    @Param('idConseiller') _idConseiller: string,
    @Param('idListeDeDiffusion') idListeDeDiffusion: string,
    @Body() payload: UpdateListeDeDiffusionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: UpdateListeDeDiffusionCommand = {
      id: idListeDeDiffusion,
      titre: payload.titre,
      idsBeneficiaires: payload.idsBeneficiaires
    }
    const result = await this.updateListeDeDiffusionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }
  }

  @ApiOperation({
    summary: 'récupère les listes de diffusion du conseiller',
    description: 'Autorisé pour le conseiller'
  })
  @Get()
  @ApiResponse({
    type: ListeDeDiffusionQueryModel,
    isArray: true
  })
  async getListesDeDiffusion(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ListeDeDiffusionQueryModel[]> {
    const result = await this.getListesDeDiffusionQueryHandler.execute(
      { idConseiller },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
