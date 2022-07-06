import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from 'src/application/commands/add-favori-offre-immersion.command.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { GetFavorisOffresImmersionJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-model'
import {
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-model'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../application/commands/add-favori-offre-emploi.command.handler'
import {
  AddFavoriServiceCiviqueCommand,
  AddFavoriOffreServiceCiviqueCommandHandler
} from '../../application/commands/add-favori-offre-service-civique-command-handler.service'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../application/commands/delete-favori-offre-emploi.command.handler'
import {
  DeleteFavoriOffreServiceCiviqueCommand,
  DeleteFavoriOffreEngagementCommandHandler
} from '../../application/commands/delete-favori-offre-engagement.command.handler'
import {
  DeleteFavoriOffreImmersionCommand,
  DeleteFavoriOffreImmersionCommandHandler
} from '../../application/commands/delete-favori-offre-immersion.command.handler'
import { FavoriExisteDejaError } from '../../building-blocks/types/domain-error'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  AddFavoriImmersionPayload,
  AddFavoriOffresEmploiPayload,
  AddFavoriServicesCivique,
  GetFavorisOffresEmploiQueryParams,
  GetFavorisOffresImmersionQueryParams,
  GetFavorisServicesCiviqueQueryParams
} from './validation/favoris.inputs'
import { GetFavorisServiceCiviqueJeuneQueryHandler } from '../../application/queries/get-favoris-service-civique-jeune.query.handler'
import { ServiceCiviqueQueryModel } from 'src/application/queries/query-models/service-civique.query-model'
import { Core } from 'src/domain/core'

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Favoris')
export class FavorisController {
  constructor(
    private readonly getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler,
    private readonly getFavorisOffresImmersionJeuneQueryHandler: GetFavorisOffresImmersionJeuneQueryHandler,
    private readonly getFavorisServiceCiviqueJeuneQueryHandler: GetFavorisServiceCiviqueJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler,
    private readonly addFavoriOffreImmersionCommandHandler: AddFavoriOffreImmersionCommandHandler,
    private readonly addFavoriOffreEngagementCommandHandler: AddFavoriOffreServiceCiviqueCommandHandler,
    private readonly deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriOffreImmersionCommandHandler: DeleteFavoriOffreImmersionCommandHandler,
    private readonly deleteFavoriOffreEngagementCommandHandler: DeleteFavoriOffreEngagementCommandHandler
  ) {}

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
  ): Promise<OffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]> {
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

    if (isFailure(result)) {
      if (result.error.code === FavoriExisteDejaError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.CONFLICT)
      }
      throw new RuntimeException(result.error.message)
    }
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

    if (isFailure(result)) {
      if (result.error.code === FavoriExisteDejaError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.CONFLICT)
      }
      throw new RuntimeException(result.error.message)
    }
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

    if (isFailure(result)) {
      if (result.error.code === FavoriExisteDejaError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.CONFLICT)
      }
      throw new RuntimeException(result.error.message)
    }
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
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
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
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
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
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }
}
