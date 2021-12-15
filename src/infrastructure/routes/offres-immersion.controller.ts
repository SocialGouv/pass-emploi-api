import { Controller, Get, Query } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { OffreImmersionQueryModel } from 'src/application/queries/query-models/offres-immersion.query-models'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../application/queries/get-offres-immersion.query.handler'
import { FindOffresImmersionQuery } from './validation/offres-immersion.inputs'

@Controller('offres-immersion')
@ApiOAuth2([])
@ApiTags("Offres d'immersion")
export class OffresImmersionController {
  constructor(
    private readonly getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler
  ) {}

  @Get()
  @ApiResponse({
    type: OffreImmersionQueryModel,
    isArray: true
  })
  getOffresImmersion(
    @Query() findOffresImmersionQuery: FindOffresImmersionQuery
  ): Promise<OffreImmersionQueryModel[]> {
    const query: GetOffresImmersionQuery = {
      rome: findOffresImmersionQuery.rome,
      lat: findOffresImmersionQuery.lat,
      lon: findOffresImmersionQuery.lon
    }

    return this.getOffresImmersionQueryHandler.execute(query)
  }
}
