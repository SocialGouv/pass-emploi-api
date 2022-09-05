import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  SetMetadata,
  UseGuards
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger'
import {
  DetailOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from '../../application/queries/query-models/offres-immersion.query-model'
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
import {
  GetOffresImmersionQueryParams,
  NouvellesOffresImmersions
} from './validation/offres-immersion.inputs'
import {
  GetDetailOffreImmersionQuery,
  GetDetailOffreImmersionQueryHandler
} from '../../application/queries/get-detail-offre-immersion.query.handler'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { NotifierNouvellesImmersionsCommandHandler } from '../../application/commands/notifier-nouvelles-immersions.command.handler'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'

@Controller('offres-immersion')
@ApiOAuth2([])
@ApiTags("Offres d'immersion")
export class OffresImmersionController {
  constructor(
    private readonly getDetailOffreImmersionQueryHandler: GetDetailOffreImmersionQueryHandler,
    private readonly getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler,
    private readonly notifierNouvellesImmersionsCommandHandler: NotifierNouvellesImmersionsCommandHandler
  ) {}

  @Get()
  @ApiResponse({
    type: OffreImmersionQueryModel,
    isArray: true
  })
  async getOffresImmersion(
    @Query() getOffresImmersionQueryParams: GetOffresImmersionQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreImmersionQueryModel[]> {
    const query: GetOffresImmersionQuery = {
      rome: getOffresImmersionQueryParams.rome,
      lat: getOffresImmersionQueryParams.lat,
      lon: getOffresImmersionQueryParams.lon,
      distance: getOffresImmersionQueryParams.distance
    }

    const result = await this.getOffresImmersionQueryHandler.execute(
      query,
      utilisateur
    )

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
    @Param('idOffreImmersion') idOffreImmersion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailOffreImmersionQueryModel | undefined> {
    const query: GetDetailOffreImmersionQuery = {
      idOffreImmersion
    }
    const result = await this.getDetailOffreImmersionQueryHandler.execute(
      query,
      utilisateur
    )
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

  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.IMMERSION
  )
  @Post()
  @HttpCode(202)
  async notifierNouvellesImmersions(
    @Body() nouvellesImmersions: NouvellesOffresImmersions
  ): Promise<void> {
    this.notifierNouvellesImmersionsCommandHandler.execute({
      immersions: nouvellesImmersions.immersions
    })
  }
}
