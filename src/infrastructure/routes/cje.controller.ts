import { Controller, Get, Param } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  CJETokenQueryModel,
  GetCJETokenQueryHandler
} from '../../application/queries/get-cje-token.query.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'

@Controller('jeunes/:idJeune/cje')
@CustomSwaggerApiOAuth2()
@ApiTags('CJE')
export class CJEController {
  constructor(
    private readonly getCJETokenQueryHandler: GetCJETokenQueryHandler
  ) {}

  @Get('token')
  @ApiResponse({
    type: CJETokenQueryModel
  })
  async getCJEToken(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<CJETokenQueryModel> {
    const result = await this.getCJETokenQueryHandler.execute(
      {
        idJeune
      },
      utilisateur
    )

    return handleResult(result)
  }
}
