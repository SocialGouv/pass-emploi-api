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
import { GetFavorisOffresEmploiIdsJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-emploi-ids-jeune.query.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-emploi-jeune.query.handler'
import {
  FavoriIdQueryModel,
  OffreEmploiResumeQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../application/commands/add-favori-offre-emploi.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../application/commands/delete-favori-offre-emploi.command.handler'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  AddFavoriOffresEmploiPayload,
  GetFavorisOffresEmploiQuery
} from './validation/favoris.inputs'

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Favoris')
export class FavorisController {
  constructor(
    private readonly getFavorisOffresEmploiIdsJeuneQueryHandler: GetFavorisOffresEmploiIdsJeuneQueryHandler,
    private readonly getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriOffreEmploiCommandHandler: DeleteFavoriOffreEmploiCommandHandler
  ) {}

  @Get('favoris/offres-emploi')
  async getFavorisOffresEmploi(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisOffresEmploiQuery,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriIdQueryModel[]> {
    if (getFavorisQuery.detail === 'true') {
      return await this.getFavorisOffresEmploiJeuneQueryHandler.execute(
        { idJeune },
        utilisateur
      )
    }
    return await this.getFavorisOffresEmploiIdsJeuneQueryHandler.execute(
      { idJeune },
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
      if (result.error.code === NonTrouveError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.NOT_FOUND)
      }
      if (result.error.code === FavoriExisteDejaError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.CONFLICT)
      }
      throw new RuntimeException(result.error.message)
    }
  }

  @Delete('favori/:idOffreEmploi')
  @HttpCode(204)
  async deleteFavoriOffresEmploi(
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
}
