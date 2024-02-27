import { Controller, Get, Param, Query } from '@nestjs/common'
import {
  ApiOAuth2,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsOptional } from 'class-validator'
import {
  DiagorienteMetiersFavorisQueryModel,
  GetDiagorienteMetiersFavorisQueryHandler
} from '../../application/queries/get-diagoriente-metiers-favoris.query.handler'
import {
  DiagorienteUrlsQueryModel,
  GetDiagorienteUrlsQueryHandler
} from '../../application/queries/get-diagoriente-urls.query.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleResult } from './result.handler'
import { transformStringToBoolean } from './validation/utils/transformers'

class GetDiagorienteMetiersFavorisQueryParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @IsIn([true, false])
  @Transform(params => transformStringToBoolean(params, 'detail'))
  detail?: boolean
}

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

    return handleResult(result)
  }

  @Get('metiers-favoris')
  @ApiResponse({
    type: DiagorienteMetiersFavorisQueryModel
  })
  async getDiagorienteMetiersFavoris(
    @Param('idJeune') idJeune: string,
    @Query()
    getDiagorienteMetiersFavorisQueryParams: GetDiagorienteMetiersFavorisQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DiagorienteMetiersFavorisQueryModel> {
    const result = await this.getDiagorienteMetiersFavorisQueryHandler.execute(
      {
        idJeune,
        detail: getDiagorienteMetiersFavorisQueryParams.detail
      },
      utilisateur
    )

    return handleResult(result)
  }
}
