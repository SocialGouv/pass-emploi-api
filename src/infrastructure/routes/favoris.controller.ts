import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../application/commands/add-favori-offre-emploi.command.handler'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from '../../application/commands/add-favori-offre-immersion.command.handler'
import {
  AddFavoriOffreServiceCiviqueCommandHandler,
  AddFavoriServiceCiviqueCommand
} from '../../application/commands/add-favori-offre-service-civique.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../application/commands/delete-favori-offre-emploi.command.handler'
import {
  DeleteFavoriOffreImmersionCommand,
  DeleteFavoriOffreImmersionCommandHandler
} from '../../application/commands/delete-favori-offre-immersion.command.handler'
import {
  DeleteFavoriOffreServiceCiviqueCommand,
  DeleteFavoriOffreServiceCiviqueCommandHandler
} from '../../application/commands/delete-favori-offre-service-civique.command.handler'
import { GetFavorisJeuneQueryHandler } from '../../application/queries/favoris/get-favoris-jeune.query.handler.db'
import { GetMetadonneesFavorisJeuneQueryHandler } from '../../application/queries/favoris/get-metadonnees-favoris-jeune.query.handler.db'
import { GetFavorisOffresEmploiJeuneQueryHandler } from '../../application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { GetFavorisOffresImmersionJeuneQueryHandler } from '../../application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import { GetFavorisServiceCiviqueJeuneQueryHandler } from '../../application/queries/get-favoris-service-civique-jeune.query.handler.db'
import {
  FavorisQueryModel,
  MetadonneesFavorisQueryModel
} from '../../application/queries/query-models/favoris.query-model'
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel
} from '../../application/queries/query-models/offres-emploi.query-model'
import {
  FavoriOffreImmersionIdQueryModel,
  FavoriOffreImmersionQueryModel,
  OffreImmersionQueryModel
} from '../../application/queries/query-models/offres-immersion.query-model'
import { ServiceCiviqueQueryModel } from '../../application/queries/query-models/service-civique.query-model'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import {
  AddFavoriImmersionPayload,
  AddFavoriOffresEmploiPayload,
  AddFavoriServicesCivique,
  GetFavorisOffresEmploiQueryParams,
  GetFavorisOffresImmersionQueryParams,
  GetFavorisServicesCiviqueQueryParams
} from './validation/favoris.inputs'

@Controller('jeunes/:idJeune')
@CustomSwaggerApiOAuth2()
@ApiTags('Favoris')
export class FavorisController {
  constructor(
    private readonly getFavorisJeuneQueryHandler: GetFavorisJeuneQueryHandler,
    private readonly getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler,
    private readonly getFavorisOffresImmersionJeuneQueryHandler: GetFavorisOffresImmersionJeuneQueryHandler,
    private readonly getFavorisServiceCiviqueJeuneQueryHandler: GetFavorisServiceCiviqueJeuneQueryHandler,
    private readonly getMetadonneesFavorisJeuneQueryHandler: GetMetadonneesFavorisJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler,
    private readonly addFavoriOffreImmersionCommandHandler: AddFavoriOffreImmersionCommandHandler,
    private readonly addFavoriOffreEngagementCommandHandler: AddFavoriOffreServiceCiviqueCommandHandler,
    private readonly deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriOffreImmersionCommandHandler: DeleteFavoriOffreImmersionCommandHandler,
    private readonly deleteFavoriOffreEngagementCommandHandler: DeleteFavoriOffreServiceCiviqueCommandHandler
  ) {}

  @ApiOperation({
    summary: "Récupère tous les favoris d'un jeune",
    description: 'Autorisé pour le jeune et son conseiller'
  })
  @ApiResponse({
    type: FavorisQueryModel,
    isArray: true
  })
  @Get('favoris')
  async getFavorisDuJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<FavorisQueryModel[]> {
    return this.getFavorisJeuneQueryHandler.execute({ idJeune }, utilisateur)
  }

  @ApiOperation({
    summary: "Récupère les favoris d'offres d'emploi",
    description: 'Autorisé pour un jeune'
  })
  @ApiResponse({
    type: OffreEmploiResumeQueryModel,
    isArray: true
  })
  @Get('favoris/offres-emploi')
  async getFavorisOffresEmploi(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisOffresEmploiQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]> {
    return this.getFavorisOffresEmploiJeuneQueryHandler.execute(
      { idJeune, detail: Boolean(getFavorisQuery.detail) },
      utilisateur
    )
  }

  @ApiOperation({
    summary: "Récupère les favoris d'offres d'immersion",
    description: 'Autorisé pour un jeune'
  })
  @ApiResponse({
    type: OffreImmersionQueryModel,
    isArray: true
  })
  @Get('favoris/offres-immersion')
  async getFavorisOffresImmersion(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisOffresImmersionQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<
    FavoriOffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]
  > {
    return this.getFavorisOffresImmersionJeuneQueryHandler.execute(
      { idJeune, detail: Boolean(getFavorisQuery.detail) },
      utilisateur
    )
  }

  @ApiOperation({
    summary: "Récupère les favoris d'offres de service civique",
    description: 'Autorisé pour un jeune'
  })
  @ApiResponse({
    type: ServiceCiviqueQueryModel,
    isArray: true
  })
  @Get('favoris/services-civique')
  async getFavorisServicesCivique(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisServicesCiviqueQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ServiceCiviqueQueryModel[] | Core.Id[]> {
    return this.getFavorisServiceCiviqueJeuneQueryHandler.execute(
      { idJeune, detail: Boolean(getFavorisQuery.detail) },
      utilisateur
    )
  }

  @ApiOperation({
    summary: 'Récupère les métadonnées des favoris du jeune',
    description: 'Autorisé pour un conseiller du jeune'
  })
  @Get('favoris/metadonnees')
  @ApiResponse({ type: MetadonneesFavorisQueryModel })
  async getMetadonneesFavorisJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<MetadonneesFavorisQueryModel> {
    const result = await this.getMetadonneesFavorisJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )

    return handleResult(result)
  }

  @Post('favoris/offres-emploi')
  async postNouveauFavoriOffresEmploi(
    @Param('idJeune') idJeune: string,
    @Body() addFavoriPayload: AddFavoriOffresEmploiPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: AddFavoriOffreEmploiCommand = {
      idJeune,
      offreEmploi: {
        id: addFavoriPayload.idOffre,
        nomEntreprise: addFavoriPayload.nomEntreprise,
        duree: addFavoriPayload.duree,
        titre: addFavoriPayload.titre,
        alternance: addFavoriPayload.alternance,
        typeContrat: addFavoriPayload.typeContrat,
        localisation: addFavoriPayload.localisation
      }
    }
    const result = await this.addFavoriOffreEmploiCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Post('favoris/offres-immersion')
  async postNouveauFavoriOffresImmersion(
    @Param('idJeune') idJeune: string,
    @Body() addFavoriPayload: AddFavoriImmersionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: AddFavoriOffreImmersionCommand = {
      idJeune,
      offreImmersion: {
        id: addFavoriPayload.idOffre,
        metier: addFavoriPayload.metier,
        nomEtablissement: addFavoriPayload.nomEtablissement,
        secteurActivite: addFavoriPayload.secteurActivite,
        ville: addFavoriPayload.ville
      }
    }
    const result = await this.addFavoriOffreImmersionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Post('favoris/services-civique')
  async postNouveauFavoriServicesCivique(
    @Param('idJeune') idJeune: string,
    @Body() addFavoriPayload: AddFavoriServicesCivique,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: AddFavoriServiceCiviqueCommand = {
      idJeune,
      offre: addFavoriPayload
    }
    const result = await this.addFavoriOffreEngagementCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Delete('favoris/offres-emploi/:idOffreEmploi')
  @HttpCode(204)
  async deleteFavoriOffreEmploi(
    @Param('idJeune') idJeune: string,
    @Param('idOffreEmploi') idOffreEmploi: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteFavoriOffreEmploiCommand = {
      idJeune,
      idOffreEmploi
    }
    const result = await this.deleteFavoriOffreEmploiCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Delete('favoris/offres-immersion/:idOffreImmersion')
  @HttpCode(204)
  async deleteFavoriOffreImmersion(
    @Param('idJeune') idJeune: string,
    @Param('idOffreImmersion') idOffreImmersion: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteFavoriOffreImmersionCommand = {
      idJeune,
      idOffreImmersion
    }

    const result = await this.deleteFavoriOffreImmersionCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Delete('favoris/services-civique/:idOffre')
  @HttpCode(204)
  async deleteFavoriServiceCivique(
    @Param('idJeune') idJeune: string,
    @Param('idOffre') idOffre: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteFavoriOffreServiceCiviqueCommand = {
      idJeune,
      idOffre
    }

    const result = await this.deleteFavoriOffreEngagementCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }
}
