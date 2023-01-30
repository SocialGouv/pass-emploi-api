import { Controller, Get, Param } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  DiagorienteUrlQueryModel,
  GetDiagorienteUrlQueryHandler,
  TypeUrlDiagoriente
} from '../../application/queries/get-diagoriente-url.query.handler.db'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'

@Controller('jeunes/:idJeune/diagoriente')
@ApiOAuth2([])
@ApiTags('Diagoriente')
export class DiagorienteController {
  constructor(
    private readonly getDiagorienteUrlQueryHandler: GetDiagorienteUrlQueryHandler
  ) {}

  @Get('urls/chatbot')
  @ApiResponse({
    type: DiagorienteUrlQueryModel
  })
  async getDiagorienteUrlChatbot(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DiagorienteUrlQueryModel> {
    const result = await this.getDiagorienteUrlQueryHandler.execute(
      {
        idJeune,
        typeUrl: TypeUrlDiagoriente.CHATBOT
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Get('urls/metiers-favoris')
  @ApiResponse({
    type: DiagorienteUrlQueryModel
  })
  async getDiagorienteUrlFavoris(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DiagorienteUrlQueryModel> {
    const result = await this.getDiagorienteUrlQueryHandler.execute(
      {
        idJeune,
        typeUrl: TypeUrlDiagoriente.FAVORIS
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
