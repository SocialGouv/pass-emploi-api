import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UpdateSessionMiloCommandHandler } from 'src/application/commands/milo/update-session-milo.command.handler'
import { GetDetailSessionMiloQueryHandler } from 'src/application/queries/milo/get-detail-session.milo.query.handler.db'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import {
  DetailSessionConseillerMiloQueryModel,
  SessionConseillerMiloQueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { DateService } from 'src/utils/date-service'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import {
  GetSessionsQueryParams,
  UpdateSessionMiloPayload
} from './validation/conseiller-milo.inputs'

@Controller('conseillers/milo')
@ApiOAuth2([])
@ApiTags('Conseillers Milo')
export class ConseillersMiloController {
  constructor(
    private readonly getSessionsMiloQueryHandler: GetSessionsConseillerMiloQueryHandler,
    private readonly getDetailSessionMiloQueryHandler: GetDetailSessionMiloQueryHandler,
    private readonly updateSessionMiloCommandHandler: UpdateSessionMiloCommandHandler
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
        dateDebut: DateService.fromStringToDateTime(
          getSessionsQueryParams.dateDebut
        ),
        dateFin: DateService.fromStringToDateTime(
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

  @ApiOperation({
    summary:
      'Récupère le détail d’une session de la structure MILO du conseiller',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('/:idConseiller/sessions/:idSession')
  @ApiResponse({
    type: DetailSessionConseillerMiloQueryModel
  })
  async getDetailSession(
    @Param('idConseiller') idConseiller: string,
    @Param('idSession') idSession: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DetailSessionConseillerMiloQueryModel> {
    const result = await this.getDetailSessionMiloQueryHandler.execute(
      { idSession, idConseiller, token: accessToken },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Modifie la visibilité d’une session de la structure MILO du conseiller',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Put('/:idConseiller/sessions/:idSession')
  async updateSession(
    @Param('idConseiller') idConseiller: string,
    @Param('idSession') idSession: string,
    @Body() updateSessionMiloPayload: UpdateSessionMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<void> {
    const result = await this.updateSessionMiloCommandHandler.execute(
      {
        idSession,
        idConseiller,
        token: accessToken,
        estVisible: updateSessionMiloPayload.estVisible
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
