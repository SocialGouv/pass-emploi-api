import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { DateTime } from 'luxon'
import AutoinscrireBeneficiaireSessionMiloCommandHandler from 'src/application/commands/milo/autoinscrire-beneficiaire-session-milo.command.handler'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/milo/get-accueil-jeune-milo.query.handler.db'
import { GetDetailSessionJeuneMiloQueryHandler } from 'src/application/queries/milo/get-detail-session-jeune.milo.query.handler.db'
import { GetSessionsJeuneMiloQueryHandler } from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler.db'
import {
  AccueilJeuneMiloQueryModel,
  GetMonSuiviMiloQueryModel
} from 'src/application/queries/query-models/jeunes.milo.query-model'
import {
  DetailSessionJeuneMiloQueryModel,
  SessionJeuneMiloQueryModel
} from 'src/application/queries/query-models/sessions.milo.query.model'

import { Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { handleResult } from 'src/infrastructure/routes/result.handler'
import { GetMonSuiviMiloQueryHandler } from '../../application/queries/milo/get-mon-suivi-jeune.milo.query.handler.db'
import { DateService } from '../../utils/date-service'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { MaintenantQueryParams } from './validation/jeunes.inputs'
import {
  GetMonSuiviQueryParams,
  GetSessionsJeunesQueryParams
} from './validation/jeunes.milo.inputs'

@Controller('jeunes')
@CustomSwaggerApiOAuth2()
@ApiTags('Jeunes Milo')
export class JeunesMiloController {
  constructor(
    private readonly getAccueilQueryHandler: GetAccueilJeuneMiloQueryHandler,
    private readonly getSessionsQueryHandler: GetSessionsJeuneMiloQueryHandler,
    private readonly getDetailSessionQueryHandler: GetDetailSessionJeuneMiloQueryHandler,
    private readonly autoinscrireBeneficiaireSessionMiloCommandHandler: AutoinscrireBeneficiaireSessionMiloCommandHandler,
    private readonly getMonSuiviMiloQueryHandler: GetMonSuiviMiloQueryHandler
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Inscrit un bénéficiaire à une session',
    description: 'Autorisé pour le bénéficiaire Milo'
  })
  @Post('/milo/:idBeneficiaire/sessions/:idSession/inscrire')
  @HttpCode(HttpStatus.NO_CONTENT)
  async inscrireBeneficiaireSession(
    @Param('idBeneficiaire') idBeneficiaire: string,
    @Param('idSession') idSession: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<void> {
    const result =
      await this.autoinscrireBeneficiaireSessionMiloCommandHandler.execute(
        { idSession, idBeneficiaire, accessToken: accessToken },
        utilisateur
      )

    return handleResult(result)
  }

  @Get('/milo/:idJeune/mon-suivi')
  @ApiOperation({
    description: "Récupère les éléments de la page 'Mon Suivi' d'un jeune Milo"
  })
  @ApiResponse({
    type: GetMonSuiviMiloQueryModel
  })
  async getJeunes(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: GetMonSuiviQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<GetMonSuiviMiloQueryModel> {
    const result: Result<GetMonSuiviMiloQueryModel> =
      await this.getMonSuiviMiloQueryHandler.execute(
        {
          idJeune,
          dateDebut: DateTime.fromISO(queryParams.dateDebut, {
            setZone: true
          }),
          dateFin: DateTime.fromISO(queryParams.dateFin, {
            setZone: true
          }),
          accessToken: accessToken
        },
        utilisateur
      )
    return handleResult(result)
  }
}
