import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/accueil/get-accueil-jeune-milo.query.handler.db'
import { AccueilJeuneMiloQueryModel } from 'src/application/queries/query-models/jeunes.milo.query-model'

import { isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './result.handler'

import { MaintenantQueryParams } from './validation/jeunes.inputs'
import {
  DetailSessionJeuneMiloQueryModel,
  SessionJeuneMiloQueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'
import { GetSessionsJeuneMiloQueryHandler } from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler.db'
import { GetDetailSessionJeuneMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-jeune.milo.query.handler.db'
import { GetSessionsJeunesQueryParams } from './validation/jeunes-milo.inputs'
import { DateService } from '../../utils/date-service'

@Controller('jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes Milo')
export class JeunesMiloController {
  constructor(
    private readonly getAccueilQueryHandler: GetAccueilJeuneMiloQueryHandler,
    private readonly getSessionsQueryHandler: GetSessionsJeuneMiloQueryHandler,
    private readonly getDetailSessionQueryHandler: GetDetailSessionJeuneMiloQueryHandler
  ) {}

  @Get(':idJeune/milo/accueil')
  @ApiOperation({
    description:
      "Permet de récupérer les éléments de la page d'accueil d'un jeune MILO"
  })
  @ApiResponse({
    type: AccueilJeuneMiloQueryModel
  })
  async getAccueilMilo(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: MaintenantQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<AccueilJeuneMiloQueryModel> {
    const result = await this.getAccueilQueryHandler.execute(
      {
        idJeune,
        maintenant: queryParams.maintenant,
        accessToken: accessToken
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
      "Récupère la liste des sessions d'un jeune MILO que les conseillers ont rendu visibles",
    description: 'Autorisé pour les jeunes Milo et leurs conseillers'
  })
  @Get('/milo/:idJeune/sessions')
  @ApiResponse({
    type: SessionJeuneMiloQueryModel,
    isArray: true
  })
  async getSessions(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getSessionsJeunesQueryParams: GetSessionsJeunesQueryParams
  ): Promise<SessionJeuneMiloQueryModel[]> {
    const result = await this.getSessionsQueryHandler.execute(
      {
        idJeune,
        accessToken: accessToken,
        dateDebut: DateService.fromStringToLocaleDateTime(
          getSessionsJeunesQueryParams.dateDebut
        ),
        dateFin: DateService.fromStringToLocaleDateTime(
          getSessionsJeunesQueryParams.dateFin
        ),
        filtrerEstInscrit: getSessionsJeunesQueryParams.filtrerEstInscrit
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Récupère le détail d’une session',
    description: 'Autorisé pour le jeune Milo'
  })
  @Get('/milo/:idJeune/sessions/:idSession')
  @ApiResponse({
    type: DetailSessionJeuneMiloQueryModel
  })
  async getDetailSession(
    @Param('idJeune') idJeune: string,
    @Param('idSession') idSession: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DetailSessionJeuneMiloQueryModel> {
    const result = await this.getDetailSessionQueryHandler.execute(
      { idSession, idJeune, accessToken: accessToken },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
