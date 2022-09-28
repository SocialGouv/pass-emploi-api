import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query
} from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../application/commands/create-recherche.command.handler'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import {
  CreateRechercheImmersionPayload,
  CreateRechercheOffresEmploiPayload,
  CreateRechercheServiceCiviquePayload,
  GetRecherchesQueryParams
} from './validation/recherches.inputs'
import { Recherche } from '../../domain/offre/recherche/recherche'
import {
  GetRecherchesQuery,
  GetRecherchesQueryHandler
} from '../../application/queries/get-recherches.query.handler.db'
import { RechercheQueryModel } from '../../application/queries/query-models/recherches.query-model'
import { isFailure } from '../../building-blocks/types/result'
import {
  DeleteRechercheCommand,
  DeleteRechercheCommandHandler
} from '../../application/commands/delete-recherche.command.handler'
import { RafraichirSuggestionPoleEmploiCommandHandler } from '../../application/commands/rafraichir-suggestion-pole-emploi.command.handler'
import { handleFailure } from './failure.handler'
import { Core } from '../../domain/core'
import { GetSuggestionsQueryHandler } from '../../application/queries/get-suggestions.query.handler.db'
import { SuggestionQueryModel } from '../../application/queries/query-models/suggestion.query-model'
import { DeleteSuggestionCommandHandler } from 'src/application/commands/delete-suggestion.command.handler'
import {
  CreateRechercheFromSuggestionCommandHandler,
  CreateRechercheFromSuggestionOutput
} from 'src/application/commands/create-recherche-from-suggestion.command.handler'

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Recherches')
export class RecherchesController {
  constructor(
    private readonly createRechercheCommandHandler: CreateRechercheCommandHandler,
    private readonly getRecherchesQueryHandler: GetRecherchesQueryHandler,
    private readonly deleteRechercheCommandHandler: DeleteRechercheCommandHandler,
    private readonly rafraichirSuggestionPoleEmploiCommandHandler: RafraichirSuggestionPoleEmploiCommandHandler,
    private readonly getSuggestionsQueryHandler: GetSuggestionsQueryHandler,
    private readonly createRechercheFromSuggestionCommandHandler: CreateRechercheFromSuggestionCommandHandler,
    private readonly deleteSuggestionCommandHandler: DeleteSuggestionCommandHandler
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

  @Post('recherches/services-civique')
  async creerRechercheServicesCivique(
    @Body() createRecherchePayload: CreateRechercheServiceCiviquePayload,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateRechercheCommand = {
      metier: undefined,
      idJeune: idJeune,
      type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
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
    @Query() queryParams: GetRecherchesQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RechercheQueryModel[]> {
    const query: GetRecherchesQuery = {
      idJeune,
      avecGeometrie: queryParams.avecGeometrie
    }
    return this.getRecherchesQueryHandler.execute(query, utilisateur)
  }

  @Delete('recherches/:idRecherche')
  @HttpCode(204)
  async deleteRecherche(
    @Param('idJeune') idJeune: string,
    @Param('idRecherche', new ParseUUIDPipe()) idRecherche: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteRechercheCommand = {
      idJeune,
      idRecherche
    }

    const result = await this.deleteRechercheCommandHandler.execute(
      command,
      utilisateur
    )
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }

  @Get('recherches/suggestions')
  @ApiResponse({
    type: SuggestionQueryModel,
    isArray: true
  })
  async getSuggestions(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<SuggestionQueryModel[]> {
    if (utilisateur.structure === Core.Structure.POLE_EMPLOI) {
      const result =
        await this.rafraichirSuggestionPoleEmploiCommandHandler.execute(
          {
            idJeune,
            token: accessToken
          },
          utilisateur
        )

      if (isFailure(result)) {
        throw handleFailure(result)
      }
    }
    return this.getSuggestionsQueryHandler.execute({ idJeune }, utilisateur)
  }

  @Post('recherches/suggestions/:idSuggestion/creer-recherche')
  async postRechercheSuggestion(
    @Param('idJeune') idJeune: string,
    @Param('idSuggestion') idSuggestion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<CreateRechercheFromSuggestionOutput> {
    const result =
      await this.createRechercheFromSuggestionCommandHandler.execute(
        {
          idJeune,
          idSuggestion
        },
        utilisateur
      )

    if (isFailure(result)) {
      throw handleFailure(result)
    }
    return result.data
  }

  @Delete('recherches/suggestions/:idSuggestion')
  @HttpCode(204)
  async deleteSuggestion(
    @Param('idJeune') idJeune: string,
    @Param('idSuggestion') idSuggestion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteSuggestionCommandHandler.execute(
      {
        idJeune,
        idSuggestion
      },
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }
  }
}
