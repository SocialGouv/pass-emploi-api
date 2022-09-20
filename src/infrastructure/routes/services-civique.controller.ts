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
  GetDetailServiceCiviqueQueryHandler
} from '../../application/queries/get-detail-service-civique.query.handler'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from '../../application/queries/get-services-civique.query.handler'
import {
  DetailServiceCiviqueQueryModel,
  ServiceCiviqueQueryModel
} from '../../application/queries/query-models/service-civique.query-model'
import {
  ErreurHttp,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { GetServicesCiviqueQueryParams } from './validation/services-civique.inputs'
import { DateTime } from 'luxon'

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
    type: ServiceCiviqueQueryModel,
    isArray: true
  })
  async getServicesCivique(
    @Query() findServicesCiviqueQuery: GetServicesCiviqueQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ServiceCiviqueQueryModel[]> {
    const dateDeDebutMinimum = findServicesCiviqueQuery.dateDeDebutMinimum
      ? DateTime.fromISO(findServicesCiviqueQuery.dateDeDebutMinimum)
      : undefined
    const dateDeDebutMaximum = findServicesCiviqueQuery.dateDeDebutMaximum
      ? DateTime.fromISO(findServicesCiviqueQuery.dateDeDebutMaximum)
      : undefined
    const query: GetServicesCiviqueQuery = {
      ...findServicesCiviqueQuery,
      dateDeDebutMinimum,
      dateDeDebutMaximum
    }

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
}
