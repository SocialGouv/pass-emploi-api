import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  DetailOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-models'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../application/queries/get-offres-immersion.query.handler'
import {
  RechercheDetailOffreInvalide,
  RechercheDetailOffreNonTrouve,
  RechercheOffreInvalide
} from '../../building-blocks/types/domain-error'
import { isSuccess } from '../../building-blocks/types/result'
import { GetOffresImmersionQueryParams } from './validation/offres-immersion.inputs'
import {
  GetDetailOffreImmersionQuery,
  GetDetailOffreImmersionQueryHandler
} from '../../application/queries/get-detail-offre-immersion.query.handler'

@Controller('offres-immersion')
@ApiOAuth2([])
@ApiTags("Offres d'immersion")
export class OffresImmersionController {
  constructor(
    private readonly getDetailOffreImmersionQueryHandler: GetDetailOffreImmersionQueryHandler,
    private readonly getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler
  ) {}

  @Get()
  @ApiResponse({
    type: OffreImmersionQueryModel,
    isArray: true
  })
  async getOffresImmersion(
    @Query() getOffresImmersionQueryParams: GetOffresImmersionQueryParams
  ): Promise<OffreImmersionQueryModel[]> {
    const query: GetOffresImmersionQuery = {
      rome: getOffresImmersionQueryParams.rome,
      lat: getOffresImmersionQueryParams.lat,
      lon: getOffresImmersionQueryParams.lon
    }

    const result = await this.getOffresImmersionQueryHandler.execute(query)

    if (isSuccess(result)) {
      return result.data
    }

    if (result.error.code === RechercheOffreInvalide.CODE) {
      throw new BadRequestException(result.error.message)
    }

    throw new RuntimeException(result.error.message)
  }

  @Get(':idOffreImmersion')
  @ApiResponse({
    type: DetailOffreImmersionQueryModel,
    isArray: true
  })
  async getDetailOffreImmersion(
    @Param('idOffreImmersion') idOffreImmersion: string
  ): Promise<DetailOffreImmersionQueryModel | undefined> {
    const query: GetDetailOffreImmersionQuery = {
      idOffreImmersion
    }
    const result = await this.getDetailOffreImmersionQueryHandler.execute(query)
    if (isSuccess(result)) {
      return result.data
    }

    if (result.error.code === RechercheDetailOffreNonTrouve.CODE) {
      throw new NotFoundException(result.error.message)
    } else if (result.error.code === RechercheDetailOffreInvalide.CODE) {
      throw new BadRequestException(result.error.message)
    }

    throw new RuntimeException(result.error.message)
  }
}
