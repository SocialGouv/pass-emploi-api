import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { handleResult } from 'src/infrastructure/routes/result.handler'
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
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { GetServicesCiviqueQueryParams } from './validation/services-civique.inputs'

@Controller()
@CustomSwaggerApiOAuth2()
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

    return handleResult(result)
  }

  private async getServicesCivique(
    findServicesCiviqueQuery: GetServicesCiviqueQueryParams,
    utilisateur: Authentification.Utilisateur
  ): Promise<ServicesCiviqueQueryModel> {
    const result = await this.getServicesCiviqueQueryHandler.execute(
      findServicesCiviqueQuery,
      utilisateur
    )

    return handleResult(result)
  }
}
