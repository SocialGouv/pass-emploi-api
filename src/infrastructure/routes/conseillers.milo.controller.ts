import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetSessionsMiloQueryHandler } from '../../application/queries/milo/get-sessions.milo.query.handler'
import { isSuccess } from '../../building-blocks/types/result'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { Authentification } from '../../domain/authentification'
import { GetSessionsQueryParams } from './validation/conseiller-milo.inputs'
import { DateService } from '../../utils/date-service'
import { SessionConseillerMiloQueryModel } from '../../application/queries/query-models/sessions.milo.query.model'

@Controller('conseillers/milo')
@ApiOAuth2([])
@ApiTags('Conseillers Milo')
export class ConseillersMiloController {
  constructor(
    private readonly getSessionsMiloQueryHandler: GetSessionsMiloQueryHandler
  ) {}

  @ApiOperation({
    summary: 'Récupère la liste des sessions de sa structure MILO',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('/:idConseiller/sessions')
  @ApiResponse({
    type: SessionConseillerMiloQueryModel,
    isArray: true
  })
  async getSessions(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getSessionsQueryParams: GetSessionsQueryParams
  ): Promise<SessionConseillerMiloQueryModel[]> {
    const result = await this.getSessionsMiloQueryHandler.execute(
      {
        idConseiller,
        token: accessToken,
        dateDebut: DateService.fromStringToLocaleDateTime(
          getSessionsQueryParams.dateDebut
        ),
        dateFin: DateService.fromStringToLocaleDateTime(
          getSessionsQueryParams.dateFin
        )
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
