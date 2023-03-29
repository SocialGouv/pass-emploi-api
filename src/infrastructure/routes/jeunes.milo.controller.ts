import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/accueil/get-accueil-jeune-milo.query.handler.db'
import { AccueilJeuneMiloQueryModel } from 'src/application/queries/query-models/jeunes.milo.query-model'

import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'

import { MaintenantQueryParams } from './validation/jeunes.inputs'

@Controller('jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesMiloController {
  constructor(
    private readonly getAccueilJeuneMiloQueryHandler: GetAccueilJeuneMiloQueryHandler
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
}
