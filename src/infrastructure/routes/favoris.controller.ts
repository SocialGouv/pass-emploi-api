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
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from 'src/application/commands/add-favori-offre-immersion.command.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-emploi-jeune.query.handler'
import { GetFavorisOffresImmersionJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-immersion-jeune.query.handler'
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import {
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-models'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../application/commands/add-favori-offre-emploi.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../application/commands/delete-favori-offre-emploi.command.handler'
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
  GetFavorisOffresEmploiQueryParams,
  GetFavorisOffresImmersionQueryParams
} from './validation/favoris.inputs'

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Favoris')
export class FavorisController {
  constructor(
    private readonly getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler,
    private readonly getFavorisOffresImmersionJeuneQueryHandler: GetFavorisOffresImmersionJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriOffreImmersionCommandHandler: DeleteFavoriOffreImmersionCommandHandler,
    private readonly addFavoriOffreImmersionCommandHandler: AddFavoriOffreImmersionCommandHandler
  ) {}

  @Get('favoris/offres-emploi')
  async getFavorisOffresEmploi(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisOffresEmploiQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]> {
    return await this.getFavorisOffresEmploiJeuneQueryHandler.execute(
      { idJeune, detail: getFavorisQuery.detail === 'true' },
      utilisateur
    )
  }

  @Get('favoris/offres-immersion')
  async getFavorisOffresImmersion(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisOffresImmersionQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreImmersionQueryModel[] | FavoriOffreImmersionIdQueryModel[]> {
    return await this.getFavorisOffresImmersionJeuneQueryHandler.execute(
      { idJeune, detail: getFavorisQuery.detail === 'true' },
      utilisateur
    )
  }

  @Post('favori/offres-emploi')
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

  @Post('favori/offres-immersion')
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

  @Delete('favori/offres-emploi/:idOffreEmploi')
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

  @Delete('favori/offres-immersion/:idOffreImmersion')
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
}
