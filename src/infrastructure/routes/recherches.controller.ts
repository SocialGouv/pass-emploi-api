import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../application/commands/create-recherche.command.handler'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import {
  CreateRechercheImmersionPayload,
  CreateRechercheOffresEmploiPayload
} from './validation/recherches.inputs'
import { Recherche } from '../../domain/recherche'
import {
  GetRecherchesQuery,
  GetRecherchesQueryHandler
} from '../../application/queries/get-recherches.query.handler'
import { RechercheQueryModel } from '../../application/queries/query-models/recherches.query-model'

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Recherches')
export class RecherchesController {
  constructor(
    private readonly createRechercheCommandHandler: CreateRechercheCommandHandler,
    private readonly getRecherchesQueryHandler: GetRecherchesQueryHandler
  ) {}

  @Post('recherches/offres-emploi')
  async creerRechercheOffresEmplois(
    @Body() createRecherchePayload: CreateRechercheOffresEmploiPayload,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateRechercheCommand = {
      metier: createRecherchePayload.metier,
      idJeune: idJeune,
      type: createRecherchePayload.criteres?.alternance
        ? Recherche.Type.OFFRES_ALTERNANCE
        : Recherche.Type.OFFRES_EMPLOI,
      titre: createRecherchePayload.titre,
      localisation: createRecherchePayload.localisation,
      criteres: createRecherchePayload.criteres
    }
    await this.createRechercheCommandHandler.execute(command, utilisateur)
  }

  @Post('recherches/immersions')
  async creerRechercheImmersions(
    @Body() createRecherchePayload: CreateRechercheImmersionPayload,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateRechercheCommand = {
      metier: createRecherchePayload.metier,
      idJeune: idJeune,
      type: Recherche.Type.OFFRES_IMMERSION,
      titre: createRecherchePayload.titre,
      localisation: createRecherchePayload.localisation,
      criteres: createRecherchePayload.criteres
    }
    await this.createRechercheCommandHandler.execute(command, utilisateur)
  }

  @Get('recherches')
  @ApiResponse({
    type: RechercheQueryModel,
    isArray: true
  })
  async getRecherches(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RechercheQueryModel[]> {
    const query: GetRecherchesQuery = { idJeune }
    return this.getRecherchesQueryHandler.execute(query, utilisateur)
  }
}
