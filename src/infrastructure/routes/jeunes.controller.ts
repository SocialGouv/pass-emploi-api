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
  Put,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetDetailJeuneQueryHandler } from 'src/application/queries/get-detail-jeune.query.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-emploi-jeune.query.handler'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-models'
import { DetailJeuneQueryModel } from 'src/application/queries/query-models/jeunes.query-models'
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-models'
import { RendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-models'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../application/commands/add-favori-offre-emploi.command.handler'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../application/commands/create-action.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../application/commands/delete-favori-offre-emploi.command.handler'
import { UpdateNotificationTokenCommandHandler } from '../../application/commands/update-notification-token.command.handler'
import { GetActionsByJeuneQueryHandler } from '../../application/queries/get-actions-by-jeune.query.handler'
import { GetHomeJeuneHandler } from '../../application/queries/get-home-jeune.query.handler'
import { GetAllRendezVousJeuneQueryHandler } from '../../application/queries/get-rendez-vous-jeune.query.handler'
import { ActionQueryModel } from '../../application/queries/query-models/actions.query-model'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CreateActionAvecStatutPayload } from './validation/conseillers.inputs'
import {
  AddFavoriOffresEmploiPayload,
  GetFavorisOffresEmploiQueryParams
} from './validation/favoris.inputs'
import { PutNotificationTokenInput } from './validation/jeunes.inputs'
import StatutInvalide = Action.StatutInvalide

@Controller('jeunes/:idJeune')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesController {
  constructor(
    private readonly getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler,
    private readonly updateNotificationTokenCommandHandler: UpdateNotificationTokenCommandHandler,
    private readonly getHomeJeuneHandler: GetHomeJeuneHandler,
    private readonly getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly getAllRendezVousJeuneQueryHandler: GetAllRendezVousJeuneQueryHandler,
    private readonly getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriCommandHandler: DeleteFavoriOffreEmploiCommandHandler
  ) {}

  @Get()
  @ApiResponse({
    type: DetailJeuneQueryModel
  })
  async getDetailJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneQueryModel | undefined> {
    const queryModel = await this.getDetailJeuneQueryHandler.execute(
      {
        idJeune
      },
      utilisateur
    )
    if (queryModel) {
      return queryModel
    }

    throw new HttpException(`Jeune ${idJeune} not found`, HttpStatus.NOT_FOUND)
  }

  @Put('push-notification-token')
  async updateNotificationToken(
    @Param('idJeune') idJeune: string,
    @Body() putNotificationTokenInput: PutNotificationTokenInput,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.updateNotificationTokenCommandHandler.execute(
      {
        idJeune,
        token: putNotificationTokenInput.registration_token
      },
      utilisateur
    )

    if (isFailure(result) && result.error.code === NonTrouveError.CODE) {
      throw new HttpException(result.error.message, HttpStatus.NOT_FOUND)
    }

    if (!isSuccess(result)) {
      throw new RuntimeException()
    }
  }

  @Get('home')
  async getHome(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneHomeQueryModel> {
    return await this.getHomeJeuneHandler.execute({ idJeune }, utilisateur)
  }

  @Get('actions')
  @ApiResponse({
    type: ActionQueryModel,
    isArray: true
  })
  async getActions(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ActionQueryModel[]> {
    return await this.getActionsByJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )
  }

  @Get('rendezvous')
  @ApiResponse({
    type: RendezVousQueryModel,
    isArray: true
  })
  async getRendezVous(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousQueryModel[]> {
    return await this.getAllRendezVousJeuneQueryHandler.execute(
      { idJeune },
      utilisateur
    )
  }

  @Post('action')
  async postNouvelleAction(
    @Param('idJeune') idJeune: string,
    @Body() createActionPayload: CreateActionAvecStatutPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<{ id: Action.Id }> {
    const command: CreateActionCommand = {
      contenu: createActionPayload.content,
      idJeune,
      idCreateur: idJeune,
      typeCreateur: Action.TypeCreateur.JEUNE,
      commentaire: createActionPayload.comment,
      statut: createActionPayload.status
    }
    const result = await this.createActionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return {
        id: result.data
      }
    }

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new HttpException(result.error.message, HttpStatus.NOT_FOUND)
      }
      if (result.error.code === StatutInvalide.CODE) {
        throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST)
      }
    }

    throw new RuntimeException()
  }

  // Deprecated (Mobile App v1.0.0)
  @Get('favoris')
  async getFavoris(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisOffresEmploiQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]> {
    return await this.getFavorisOffresEmploiJeuneQueryHandler.execute(
      { idJeune, detail: getFavorisQuery.detail === 'true' },
      utilisateur
    )
  }

  // Deprecated (Mobile App v1.0.0)
  @Post('favori')
  async postNouveauFavori(
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

  // Deprecated (Mobile App v1.0.0)
  @Delete('favori/:idOffreEmploi')
  @HttpCode(204)
  async deleteFavori(
    @Param('idJeune') idJeune: string,
    @Param('idOffreEmploi') idOffreEmploi: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteFavoriOffreEmploiCommand = {
      idJeune,
      idOffreEmploi
    }
    const result = await this.deleteFavoriCommandHandler.execute(
      command,
      utilisateur
    )
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }
}
