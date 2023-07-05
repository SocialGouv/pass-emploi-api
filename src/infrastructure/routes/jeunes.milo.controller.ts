import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/accueil/get-accueil-jeune-milo.query.handler.db'
import { AccueilJeuneMiloQueryModel } from 'src/application/queries/query-models/jeunes.milo.query-model'

import { isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'

import { MaintenantQueryParams } from './validation/jeunes.inputs'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'
import { GetSessionsJeuneMiloQueryHandler } from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler.db'

@Controller('jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesMiloController {
  constructor(
    private readonly getAccueilJeuneMiloQueryHandler: GetAccueilJeuneMiloQueryHandler,
    private readonly getSessionsJeuneMiloQueryHandler: GetSessionsJeuneMiloQueryHandler
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
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<AccueilJeuneMiloQueryModel> {
    const result = await this.getAccueilJeuneMiloQueryHandler.execute(
      { idJeune, maintenant: queryParams.maintenant },
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
    description: 'Autorisé pour les jeunes Milo'
  })
  @Get('/milo/:idJeune/sessions')
  @ApiResponse({
    type: SessionJeuneMiloQueryModel,
    isArray: true
  })
  async getSessions(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<SessionJeuneMiloQueryModel[]> {
    const result = await this.getSessionsJeuneMiloQueryHandler.execute(
      { idJeune, token: accessToken },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
