import { Controller, Get, Param } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  DiagorienteUrlsQueryModel,
  GetDiagorienteUrlsQueryHandler
} from '../../application/queries/get-diagoriente-urls.query.handler.db'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'

@Controller('jeunes/:idJeune/diagoriente')
@ApiOAuth2([])
@ApiTags('Diagoriente')
export class DiagorienteController {
  constructor(
    private readonly getDiagorienteUrlsQueryHandler: GetDiagorienteUrlsQueryHandler
  ) {}

  @Get('urls')
  @ApiResponse({
    type: DiagorienteUrlsQueryModel
  })
  async getDiagorienteUrlChatbot(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DiagorienteUrlsQueryModel> {
    const result = await this.getDiagorienteUrlsQueryHandler.execute(
      {
        idJeune
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
