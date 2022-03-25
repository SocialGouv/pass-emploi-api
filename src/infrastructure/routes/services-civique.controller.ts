import {
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  GetDetailServiceCiviqueQuery,
  GetDetailServiceCiviqueQueryHandler
} from '../../application/queries/get-detail-service-civique.query.handler'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from '../../application/queries/get-services-civique.query.handler'
import {
  DetailOffreEngagementQueryModel,
  OffreEngagementQueryModel
} from '../../application/queries/query-models/service-civique.query-models'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { GetServicesCiviqueQueryParams } from './validation/services-civique.inputs'

@Controller('services-civique')
@ApiOAuth2([])
@ApiTags('Services Civique')
export class ServicesCiviqueController {
  constructor(
    private readonly getServicesCiviqueQueryHandler: GetServicesCiviqueQueryHandler,
    private readonly getDetailServiceCiviqueQueryHandler: GetDetailServiceCiviqueQueryHandler
  ) {}

  @Get()
  @ApiResponse({
    type: OffreEngagementQueryModel,
    isArray: true
  })
  async getServicesCivique(
    @Query() findServicesCiviqueQuery: GetServicesCiviqueQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreEngagementQueryModel[]> {
    const query: GetServicesCiviqueQuery = findServicesCiviqueQuery

    const result = await this.getServicesCiviqueQueryHandler.execute(
      query,
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === ErreurHttp.CODE) {
        throw new HttpException(
          result.error.message,
          (result.error as ErreurHttp).statusCode
        )
      }
      throw new RuntimeException(result.error.message)
    }

    return result.data
  }

  @Get(':idOffreEngagement')
  @ApiResponse({
    type: DetailOffreEngagementQueryModel
  })
  async getDetailServiceCivique(
    @Param('idOffreEngagement') idOffreEngagement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailOffreEngagementQueryModel> {
    const query: GetDetailServiceCiviqueQuery = { idOffreEngagement }
    const result = await this.getDetailServiceCiviqueQueryHandler.execute(
      query,
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new NotFoundException(result.error)
      }
      if (result.error.code === ErreurHttp.CODE) {
        throw new HttpException(
          result.error.message,
          (result.error as ErreurHttp).statusCode
        )
      }
      throw new RuntimeException(result.error.message)
    }

    return result.data
  }
}
