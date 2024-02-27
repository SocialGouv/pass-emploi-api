import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { handleResult } from './result.handler'
import {
  CreateListeDeDiffusionCommand,
  CreateListeDeDiffusionCommandHandler
} from '../../application/commands/create-liste-de-diffusion.command.handler'
import { DeleteListeDeDiffusionCommandHandler } from '../../application/commands/delete-liste-de-diffusion.command.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
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
import { GetDetailListeDeDiffusionQueryHandler } from '../../application/queries/get-detail-liste-de-diffusion.query.handler.db'

@Controller()
@ApiOAuth2([])
@ApiTags('Listes de diffusion')
export class ListesDeDiffusionController {
  constructor(
    private readonly createListeDeDiffusionCommandHandler: CreateListeDeDiffusionCommandHandler,
    private readonly updateListeDeDiffusionCommandHandler: UpdateListeDeDiffusionCommandHandler,
    private readonly getListesDeDiffusionQueryHandler: GetListesDeDiffusionDuConseillerQueryHandler,
    private readonly deleteListeDeDiffusionCommandHandler: DeleteListeDeDiffusionCommandHandler,
    private readonly getDetailListeDeDiffusionQueryHandler: GetDetailListeDeDiffusionQueryHandler
  ) {}

  @ApiOperation({
    summary: 'Crée une liste de diffusion',
    description:
      'Autorisé pour le conseiller avec les bénéficiaires de son portefeuille.'
  })
  @Post('conseillers/:idConseiller/listes-de-diffusion')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Modifie une liste de diffusion',
    description:
      'Autorisé pour le conseiller avec les bénéficiaires de son portefeuille ou temporairement transférés.'
  })
  @Put('/listes-de-diffusion/:idListeDeDiffusion')
  async putListesDeDiffusion(
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Récupère les listes de diffusion du conseiller',
    description: 'Autorisé pour le conseiller'
  })
  @Get('conseillers/:idConseiller/listes-de-diffusion')
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Récupère une liste de diffusion',
    description: 'Autorisé pour le conseiller qui a créé la liste'
  })
  @Get('/listes-de-diffusion/:idListeDeDiffusion')
  async getDetailListeDeDiffusion(
    @Param('idListeDeDiffusion') idListeDeDiffusion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ListeDeDiffusionQueryModel> {
    const result = await this.getDetailListeDeDiffusionQueryHandler.execute(
      { idListeDeDiffusion },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Supprime une liste de diffusion',
    description: 'Autorisé pour le conseiller qui a créé la liste'
  })
  @Delete('/listes-de-diffusion/:idListeDeDiffusion')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteListeDeDiffusion(
    @Param('idListeDeDiffusion') idListeDeDiffusion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteListeDeDiffusionCommandHandler.execute(
      { idListeDeDiffusion },
      utilisateur
    )

    return handleResult(result)
  }
}
