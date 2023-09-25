import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  UpdateSessionMiloCommand,
  UpdateSessionMiloCommandHandler
} from 'src/application/commands/milo/update-session-milo.command.handler'
import { GetDetailSessionConseillerMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import {
  AgendaConseillerMiloSessionListItemQueryModel,
  DetailSessionConseillerMiloQueryModel,
  SessionConseillerMiloQueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { DateService } from 'src/utils/date-service'
import {
  EmargementSessionMiloCommand,
  EmargementSessionMiloCommandHandler
} from '../../application/commands/milo/emargement-session-milo.command.handler'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './result.handler'
import {
  EmargementsSessionMiloPayload,
  GetAgendaSessionsQueryParams,
  GetSessionsQueryParams,
  UpdateSessionMiloPayload
} from './validation/conseiller-milo.inputs'
import { GetAgendaSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { DateTime } from 'luxon'

@Controller('conseillers/milo')
@ApiOAuth2([])
@ApiTags('Conseillers Milo')
export class ConseillersMiloController {
  constructor(
    private readonly getSessionsQueryHandler: GetSessionsConseillerMiloQueryHandler,
    private readonly getDetailSessionQueryHandler: GetDetailSessionConseillerMiloQueryHandler,
    private readonly getAgendaSessionsQueryHandler: GetAgendaSessionsConseillerMiloQueryHandler,
    private readonly updateSessionCommandHandler: UpdateSessionMiloCommandHandler,
    private readonly emargementSessionCommandHandler: EmargementSessionMiloCommandHandler
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
    const result = await this.getSessionsQueryHandler.execute(
      {
        idConseiller,
        accessToken: accessToken,
        dateDebut: DateService.fromStringToDateTime(
          getSessionsQueryParams.dateDebut
        ),
        dateFin: DateService.fromStringToDateTime(
          getSessionsQueryParams.dateFin
        ),
        filtrerAClore: getSessionsQueryParams.filtrerAClore
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
      'Récupère la liste des sessions de sa structure MILO auxquelles participent ses bénéficiaires',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Get('/:idConseiller/agenda/sessions')
  @ApiResponse({
    type: AgendaConseillerMiloSessionListItemQueryModel,
    isArray: true
  })
  async getAgendaSessions(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getSessionsQueryParams: GetAgendaSessionsQueryParams
  ): Promise<AgendaConseillerMiloSessionListItemQueryModel[]> {
    const result = await this.getAgendaSessionsQueryHandler.execute(
      {
        idConseiller,
        accessToken,
        dateDebut: DateTime.fromISO(getSessionsQueryParams.dateDebut),
        dateFin: DateTime.fromISO(getSessionsQueryParams.dateFin)
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
    const result = await this.getDetailSessionQueryHandler.execute(
      { idSession, idConseiller, accessToken: accessToken },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Permet de clore une session de la structure MILO du conseiller et de faire son émargement.',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Post('/:idConseiller/sessions/:idSession/cloturer')
  async emargerSession(
    @Param('idConseiller') idConseiller: string,
    @Param('idSession') idSession: string,
    @Body() emargementSessionMiloPayload: EmargementsSessionMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<void> {
    const command: EmargementSessionMiloCommand = {
      idSession,
      idConseiller,
      accessToken: accessToken,
      emargements: emargementSessionMiloPayload.emargements
    }

    const result = await this.emargementSessionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary:
      'Modifie les informations d’une session de la structure MILO du conseiller (visibilité, inscriptions)',
    description: 'Autorisé pour le conseiller Milo'
  })
  @Patch('/:idConseiller/sessions/:idSession')
  async updateSession(
    @Param('idConseiller') idConseiller: string,
    @Param('idSession') idSession: string,
    @Body() updateSessionMiloPayload: UpdateSessionMiloPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<void> {
    const command: UpdateSessionMiloCommand = {
      idSession,
      idConseiller,
      accessToken: accessToken,
      estVisible: updateSessionMiloPayload.estVisible,
      inscriptions: updateSessionMiloPayload.inscriptions
    }

    const result = await this.updateSessionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
