import { Controller, Get, Param } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  DiagorienteMetiersFavorisQueryModel,
  GetDiagorienteMetiersFavorisQueryHandler
} from '../../application/queries/get-diagoriente-metiers-favoris.query.handler'
import {
  DiagorienteUrlsQueryModel,
  GetDiagorienteUrlsQueryHandler
} from '../../application/queries/get-diagoriente-urls.query.handler'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'

@Controller('jeunes/:idJeune/diagoriente')
@ApiOAuth2([])
@ApiTags('Diagoriente')
export class DiagorienteController {
  constructor(
    private readonly getDiagorienteUrlsQueryHandler: GetDiagorienteUrlsQueryHandler,
    private readonly getDiagorienteMetiersFavorisQueryHandler: GetDiagorienteMetiersFavorisQueryHandler
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

  @Get('metiers-favoris')
  @ApiResponse({
    type: DiagorienteMetiersFavorisQueryModel
  })
  async getDiagorienteMetiersFavoris(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DiagorienteMetiersFavorisQueryModel> {
    const result = await this.getDiagorienteMetiersFavorisQueryHandler.execute(
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
