import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import {
  SessionConseillerMiloQueryModel,
  SessionsConseillerV2QueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { GetSessionsConseillerMiloV2QueryHandler } from '../../../application/queries/milo/v2/get-sessions-v2-conseiller.milo.query.handler.db'
import {
  AccessToken,
  Utilisateur
} from '../../decorators/authenticated.decorator'
import { handleFailure } from '../failure.handler'
import { GetSessionsV2QueryParams } from '../validation/conseiller-milo.inputs'

@Controller('v2/conseillers/milo')
@ApiOAuth2([])
@ApiTags('Conseillers Milo')
export class ConseillersMiloControllerv2 {
  constructor(
    private readonly getSessionsV2QueryHandler: GetSessionsConseillerMiloV2QueryHandler
  ) {}

  //TODO a voir : definir une route metier (avec la notion de a clore)  ou technique ( avec la notion de pagination (/v2 ou /pagination))
  // definir une recuperation par pagination serait peut etre plus correct je pense
  @ApiOperation({
    summary: 'Récupère la liste des sessions à clore de sa structure MILO',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('/:idConseiller/sessions/a-clore')
  @ApiResponse({
    type: SessionConseillerMiloQueryModel,
    isArray: true
  })
  async getSessionsV2(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getSessionsACloreQueryParams: GetSessionsV2QueryParams
  ): Promise<SessionsConseillerV2QueryModel> {
    const result = await this.getSessionsV2QueryHandler.execute(
      {
        idConseiller,
        accessToken: accessToken,
        page: getSessionsACloreQueryParams.page,
        filtrerAClore: getSessionsACloreQueryParams.filtrerAClore
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}