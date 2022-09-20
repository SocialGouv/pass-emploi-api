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
import { Utilisateur } from '../decorators/authenticated.decorator'
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
import { DateTime } from 'luxon'

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Recherches')
export class RecherchesController {
  constructor(
    private readonly createRechercheCommandHandler: CreateRechercheCommandHandler,
    private readonly getRecherchesQueryHandler: GetRecherchesQueryHandler,
    private readonly deleteRechercheCommandHandler: DeleteRechercheCommandHandler
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
    const dateDeDebutMinimum = createRecherchePayload.criteres
      .dateDeDebutMinimum
      ? DateTime.fromISO(
          createRecherchePayload.criteres.dateDeDebutMinimum
        ).toUTC()
      : undefined
    const command: CreateRechercheCommand = {
      metier: undefined,
      idJeune: idJeune,
      type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
      titre: createRecherchePayload.titre,
      localisation: createRecherchePayload.localisation,
      criteres: {
        ...createRecherchePayload.criteres,
        dateDeDebutMinimum: dateDeDebutMinimum
      }
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
}
