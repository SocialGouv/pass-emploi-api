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
  GetDetailOffreServiceCiviqueQuery,
  GetDetailOffreServiceCiviqueQueryHandler
} from '../../application/queries/get-detail-offre-service-civique.query.handler'
import { GetOffresServicesCiviqueQueryHandler } from '../../application/queries/get-offres-services-civique.query.handler'
import {
  DetailServiceCiviqueQueryModel,
  ServiceCiviqueQueryModel,
  ServicesCiviqueQueryModel
} from '../../application/queries/query-models/service-civique.query-model'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { GetServicesCiviqueQueryParams } from './validation/services-civique.inputs'

@Controller()
@ApiOAuth2([])
@ApiTags('Services Civique')
export class ServicesCiviqueController {
  constructor(
    private readonly getServicesCiviqueQueryHandler: GetOffresServicesCiviqueQueryHandler,
    private readonly getDetailServiceCiviqueQueryHandler: GetDetailOffreServiceCiviqueQueryHandler
  ) {}

  @Get('services-civique')
  @ApiResponse({
    type: ServiceCiviqueQueryModel,
    isArray: true
  })
  async getServicesCiviqueV1(
    @Query() findServicesCiviqueQuery: GetServicesCiviqueQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ServiceCiviqueQueryModel[]> {
    const { results } = await this.getServicesCivique(
      findServicesCiviqueQuery,
      utilisateur
    )
    return results
  }

  @Get('v2/services-civique')
  @ApiResponse({
    type: ServicesCiviqueQueryModel
  })
  async getServicesCiviqueV2(
    @Query() findServicesCiviqueQuery: GetServicesCiviqueQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ServicesCiviqueQueryModel> {
    return this.getServicesCivique(findServicesCiviqueQuery, utilisateur)
  }

  @Get('services-civique/:idOffreEngagement')
  @ApiResponse({
    type: DetailServiceCiviqueQueryModel
  })
  async getDetailServiceCivique(
    @Param('idOffreEngagement') idOffreEngagement: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailServiceCiviqueQueryModel> {
    const query: GetDetailOffreServiceCiviqueQuery = {
      idOffre: idOffreEngagement
    }
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

  private async getServicesCivique(
    findServicesCiviqueQuery: GetServicesCiviqueQueryParams,
    utilisateur: Authentification.Utilisateur
  ): Promise<ServicesCiviqueQueryModel> {
    const result = await this.getServicesCiviqueQueryHandler.execute(
      findServicesCiviqueQuery,
      utilisateur
    )

    if (isFailure(result)) throw handleFailure(result)
    return result.data
  }
}
