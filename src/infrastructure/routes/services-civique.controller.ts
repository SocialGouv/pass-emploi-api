import { Controller, Get, HttpException, Query } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import { isFailure } from '../../building-blocks/types/result'
import { ErreurHttp } from '../../building-blocks/types/domain-error'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { GetServicesCiviqueQueryParams } from './validation/services-civique.inputs'
import { ServiceCiviqueQueryModel } from '../../application/queries/query-models/service-civique.query-models'
import {
  GetServicesCiviqueQuery,
  GetServicesCiviqueQueryHandler
} from '../../application/queries/get-services-civique.query.handler'
import { DateTime } from 'luxon'

@Controller('services-civique')
@ApiOAuth2([])
@ApiTags('Services Civique')
export class ServicesCiviqueController {
  constructor(
    private readonly getServicesCiviqueQueryHandler: GetServicesCiviqueQueryHandler
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
    const query: GetServicesCiviqueQuery = {
      ...findServicesCiviqueQuery,
      dateDeDebutMinimum: findServicesCiviqueQuery.dateDeDebutMinimum
        ? DateTime.fromISO(findServicesCiviqueQuery.dateDeDebutMinimum)
        : undefined,
      dateDeDebutMaximum: findServicesCiviqueQuery.dateDeDebutMaximum
        ? DateTime.fromISO(findServicesCiviqueQuery.dateDeDebutMaximum)
        : undefined
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
}
