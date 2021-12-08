import { Controller, Get, Logger, Query } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetCommunesEtDepartementsQuery,
  GetCommunesEtDepartementsQueryHandler
} from '../../application/queries/get-communes-et-departements.query.handler'
import { CommunesEtDepartementsQueryModel } from '../../application/queries/query-models/communes-et-departements.query-model'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Public } from '../decorators/public.decorator'

@Public()
@Controller('referentiels')
@ApiTags('Referentiels')
export class ReferentielsController {
  private logger: Logger

  constructor(
    private readonly getCommunesEtDepartementsQueryHandler: GetCommunesEtDepartementsQueryHandler
  ) {
    this.logger = new Logger('ReferentielsController')
  }

  @Get('communes-et-departements')
  @ApiResponse({
    type: CommunesEtDepartementsQueryModel,
    isArray: true
  })
  async getCommunesEtDepartements(
    @Query('recherche') recherche: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    this.logger.log(utilisateur)
    const query: GetCommunesEtDepartementsQuery = { recherche }
    const queryModel = await this.getCommunesEtDepartementsQueryHandler.execute(
      query
    )
    return queryModel
  }
}
