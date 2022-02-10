import { Controller, Get, Query } from '@nestjs/common'
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
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
  @ApiQuery({ name: 'villesOnly', required: false, type: 'boolean' })
  async getCommunesEtDepartements(
    @Query('recherche') recherche: string,
    @Query('villesOnly') villesOnly: string
  ): Promise<CommunesEtDepartementsQueryModel[]> {
    const query: GetCommunesEtDepartementsQuery = { recherche }
    query.villesOnly = villesOnly === 'true'
    return this.getCommunesEtDepartementsQueryHandler.execute(query)
  }
}
