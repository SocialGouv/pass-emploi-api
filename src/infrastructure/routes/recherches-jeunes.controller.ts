import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query
} from '@nestjs/common'
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RafraichirSuggestionsCommandHandler } from 'src/application/commands/rafraichir-suggestions.command.handler'
import { CreateRechercheFromSuggestionCommandHandler } from '../../application/commands/create-recherche-from-suggestion.command.handler'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../application/commands/create-recherche.command.handler'
import {
  DeleteRechercheCommand,
  DeleteRechercheCommandHandler
} from '../../application/commands/delete-recherche.command.handler'
import { RefuserSuggestionCommandHandler } from '../../application/commands/refuser-suggestion.command.handler'
import {
  GetRecherchesQuery,
  GetRecherchesQueryHandler
} from '../../application/queries/get-recherches.query.handler.db'
import { GetSuggestionsQueryHandler } from '../../application/queries/get-suggestions.query.handler.db'
import { toRechercheQueryModel } from '../../application/queries/query-mappers/recherche.mapper'
import { RechercheQueryModel } from '../../application/queries/query-models/recherches.query-model'
import { SuggestionQueryModel } from '../../application/queries/query-models/suggestion.query-model'
import { Authentification } from '../../domain/authentification'
import { Recherche } from '../../domain/offre/recherche/recherche'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import {
  CreateRechercheImmersionPayload,
  CreateRechercheOffresEmploiPayload,
  CreateRechercheServiceCiviquePayload,
  GetRecherchesQueryParams
} from './validation/recherches.inputs'
import {
  DiagorienteInformationsPayload,
  FindSuggestionsQueryParams
} from './validation/suggestions-inputs'

@Controller('jeunes/:idJeune')
@CustomSwaggerApiOAuth2()
@ApiTags('Recherches')
export class RecherchesJeunesController {
  constructor(
    private readonly createRechercheCommandHandler: CreateRechercheCommandHandler,
    private readonly getRecherchesQueryHandler: GetRecherchesQueryHandler,
    private readonly deleteRechercheCommandHandler: DeleteRechercheCommandHandler,
    private readonly rafraichirSuggestionsCommandHandler: RafraichirSuggestionsCommandHandler,
    private readonly getSuggestionsQueryHandler: GetSuggestionsQueryHandler,
    private readonly createRechercheFromSuggestionCommandHandler: CreateRechercheFromSuggestionCommandHandler,
    private readonly refuserSuggestionCommandHandler: RefuserSuggestionCommandHandler
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

    return handleResult(result)
  }

  @Get('recherches/suggestions')
  @ApiResponse({
    type: SuggestionQueryModel,
    isArray: true
  })
  @ApiQuery({ name: 'avecDiagoriente', required: false, type: 'boolean' })
  async getSuggestions(
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Param('idJeune') idJeune: string,
    @Query() findSuggestionsQueryParams: FindSuggestionsQueryParams
  ): Promise<SuggestionQueryModel[]> {
    const avecDiagoriente = findSuggestionsQueryParams.avecDiagoriente ?? false

    await this.rafraichirSuggestionsCommandHandler.execute(
      {
        idJeune,
        accessToken: accessToken,
        structure: utilisateur.structure,
        avecDiagoriente
      },
      utilisateur
    )

    return this.getSuggestionsQueryHandler.execute(
      { idJeune, avecDiagoriente },
      utilisateur
    )
  }

  @Post('recherches/suggestions/:idSuggestion/accepter')
  async accepterSuggestion(
    @Param('idJeune') idJeune: string,
    @Param('idSuggestion') idSuggestion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Body() diagorientePayload?: DiagorienteInformationsPayload
  ): Promise<RechercheQueryModel> {
    const result =
      await this.createRechercheFromSuggestionCommandHandler.execute(
        {
          idJeune,
          idSuggestion,
          location:
            diagorientePayload && diagorientePayload.location
              ? diagorientePayload.location
              : undefined,
          rayon:
            diagorientePayload && diagorientePayload.rayon
              ? diagorientePayload.rayon
              : undefined
        },
        utilisateur
      )

    return handleResult(result, toRechercheQueryModel)
  }

  @Post('recherches/suggestions/:idSuggestion/refuser')
  @HttpCode(200)
  async refuserSuggestion(
    @Param('idJeune') idJeune: string,
    @Param('idSuggestion') idSuggestion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.refuserSuggestionCommandHandler.execute(
      {
        idJeune,
        idSuggestion
      },
      utilisateur
    )

    return handleResult(result)
  }
}
