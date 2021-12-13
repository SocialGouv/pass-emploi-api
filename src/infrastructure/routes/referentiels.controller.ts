import { Controller, Get, Query } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetCommunesEtDepartementsQuery,
  GetCommunesEtDepartementsQueryHandler
} from '../../application/queries/get-communes-et-departements.query.handler'
import { CommunesEtDepartementsQueryModel } from '../../application/queries/query-models/communes-et-departements.query-model'
import { Public } from '../decorators/public.decorator'

@Public()
@Controller('referentiels')
@ApiTags('Referentiels')
export class ReferentielsController {
  constructor(
    private readonly getCommunesEtDepartementsQueryHandler: GetCommunesEtDepartementsQueryHandler
  ) {}

  @Get('communes-et-departements')
  @ApiResponse({
    type: CommunesEtDepartementsQueryModel,
    isArray: true
  })
  async getCommunesEtDepartements(
    @Query('recherche') recherche: string
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const query: GetCommunesEtDepartementsQuery = { recherche }
    const queryModel = await this.getCommunesEtDepartementsQueryHandler.execute(
      query
    )
    return queryModel
  }
}
