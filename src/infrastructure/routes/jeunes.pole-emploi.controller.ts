import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'

import { MaintenantQueryParams } from './validation/jeunes.inputs'
import { GetAccueilJeunePoleEmploiQueryHandler } from '../../application/queries/accueil/get-accueil-jeune-pole-emploi.query.handler.db'
import {
  AccueilJeunePoleEmploiQueryModel,
  CVPoleEmploiQueryModel
} from '../../application/queries/query-models/jeunes.pole-emploi.query-model'
import { GetCVPoleEmploiQueryHandler } from '../../application/queries/get-cv-pole-emploi.query.handler'

@Controller('jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesPoleEmploiController {
  constructor(
    private readonly getAccueilJeunePoleEmploiQueryHandler: GetAccueilJeunePoleEmploiQueryHandler,
    private readonly getCVPoleEmploiQueryHandler: GetCVPoleEmploiQueryHandler
  ) {}

  @Get(':idJeune/pole-emploi/accueil')
  @ApiOperation({
    description:
      "Permet de récupérer les éléments de la page d'accueil d'un jeune Pôle Emploi"
  })
  @ApiResponse({
    type: AccueilJeunePoleEmploiQueryModel
  })
  async getAccueilPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: MaintenantQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<AccueilJeunePoleEmploiQueryModel> {
    const result = await this.getAccueilJeunePoleEmploiQueryHandler.execute(
      { idJeune, maintenant: queryParams.maintenant, accessToken },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Get(':idJeune/pole-emploi/cv')
  @ApiOperation({
    description: "Permet de récupérer les cvs d'un jeune Pôle Emploi"
  })
  @ApiResponse({
    type: CVPoleEmploiQueryModel,
    isArray: true
  })
  async getCVPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<CVPoleEmploiQueryModel[]> {
    const result = await this.getCVPoleEmploiQueryHandler.execute(
      { idJeune, accessToken },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }
}
