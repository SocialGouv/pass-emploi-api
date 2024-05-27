import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  SetMetadata,
  UseGuards
} from '@nestjs/common'
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { EnvoyerFormulaireContactImmersionCommandHandler } from '../../application/commands/envoyer-formulaire-contact-immersion.command.handler.db'
import { NotifierNouvellesImmersionsCommandHandler } from '../../application/commands/notifier-nouvelles-immersions.command.handler'
import {
  GetDetailOffreImmersionQuery,
  GetDetailOffreImmersionQueryHandler
} from '../../application/queries/get-detail-offre-immersion.query.handler'
import {
  GetOffresImmersionQuery,
  GetOffresImmersionQueryHandler
} from '../../application/queries/get-offres-immersion.query.handler'
import {
  DetailOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from '../../application/queries/query-models/offres-immersion.query-model'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import {
  GetOffresImmersionQueryParams,
  NouvellesOffresImmersions,
  PostImmersionContactBody
} from './validation/offres-immersion.inputs'

@Controller()
@CustomSwaggerApiOAuth2()
@ApiTags("Offres d'immersion")
export class OffresImmersionController {
  constructor(
    private readonly getDetailOffreImmersionQueryHandler: GetDetailOffreImmersionQueryHandler,
    private readonly getOffresImmersionQueryHandler: GetOffresImmersionQueryHandler,
    private readonly notifierNouvellesImmersionsCommandHandler: NotifierNouvellesImmersionsCommandHandler,
    private readonly envoyerFormulaireContactImmersionCommandHandler: EnvoyerFormulaireContactImmersionCommandHandler
  ) {}

  @Get('offres-immersion')
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

    return handleResult(result)
  }

  @Get('offres-immersion/:idOffreImmersion')
  @ApiResponse({
    type: DetailOffreImmersionQueryModel
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

    return handleResult(result)
  }

  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.IMMERSION
  )
  @Post('offres-immersion')
  @HttpCode(202)
  async notifierNouvellesImmersions(
    @Body() nouvellesImmersions: NouvellesOffresImmersions
  ): Promise<void> {
    this.notifierNouvellesImmersionsCommandHandler.execute({
      immersions: nouvellesImmersions.immersions
    })
  }

  @Post('jeunes/:idJeune/offres-immersion/contact')
  async postFormulaireImmersion(
    @Param('idJeune') idJeune: string,
    @Body() postImmersionContactBody: PostImmersionContactBody,
    @Utilisateur()
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result =
      await this.envoyerFormulaireContactImmersionCommandHandler.execute(
        { idJeune, ...postImmersionContactBody },
        utilisateur
      )

    return handleResult(result)
  }
}
