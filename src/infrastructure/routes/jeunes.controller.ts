import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import {
  ApiHeader,
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { Response } from 'express'
import {
  CreateDemarcheCommand,
  CreateDemarcheCommandHandler
} from 'src/application/commands/create-demarche.command.handler'
import { DeleteJeuneCommandHandler } from 'src/application/commands/delete-jeune.command.handler'
import {
  TransfererJeunesConseillerCommand,
  TransfererJeunesConseillerCommandHandler
} from 'src/application/commands/transferer-jeunes-conseiller.command.handler'
import { GetActionsJeunePoleEmploiQueryHandler } from 'src/application/queries/get-actions-jeune-pole-emploi.query.handler'
import { GetDetailJeuneQueryHandler } from 'src/application/queries/get-detail-jeune.query.handler.db'
import { GetFavorisOffresEmploiJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from 'src/application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import {
  JeuneHomeActionQueryModel,
  JeuneHomeDemarcheQueryModel,
  JeuneHomeQueryModel
} from 'src/application/queries/query-models/home-jeune.query-model'
import {
  DetailJeuneQueryModel,
  HistoriqueConseillerJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-model'
import {
  FavoriOffreEmploiIdQueryModel,
  OffreEmploiResumeQueryModel
} from 'src/application/queries/query-models/offres-emploi.query-model'
import { RendezVousJeuneQueryModel } from 'src/application/queries/query-models/rendez-vous.query-model'
import { Core } from 'src/domain/core'
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
import { DeleteJeuneInactifCommandHandler } from '../../application/commands/delete-jeune-inactif.command.handler'
import {
  UpdateStatutDemarcheCommand,
  UpdateStatutDemarcheCommandHandler
} from '../../application/commands/update-demarche.command.handler'
import { UpdateNotificationTokenCommandHandler } from '../../application/commands/update-notification-token.command.handler'
import {
  GetActionsByJeuneQuery,
  GetActionsByJeuneQueryHandler
} from '../../application/queries/get-actions-by-jeune.query.handler.db'
import { GetConseillersJeuneQueryHandler } from '../../application/queries/get-conseillers-jeune.query.handler.db'
import { GetHomeJeuneHandler } from '../../application/queries/get-home-jeune.query.handler'
import { GetJeuneHomeActionsQueryHandler } from '../../application/queries/get-jeune-home-actions.query.handler'
import { GetJeuneHomeDemarchesQueryHandler } from '../../application/queries/get-jeune-home-demarches.query.handler'
import { GetRendezVousJeuneQueryHandler } from '../../application/queries/get-rendez-vous-jeune.query.handler.db'
import {
  ActionQueryModel,
  DemarcheQueryModel
} from '../../application/queries/query-models/actions.query-model'
import { FavoriExisteDejaError } from '../../building-blocks/types/domain-error'
import {
  isFailure,
  isSuccess,
  Result
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import { Authentification } from '../../domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { CreateActionAvecStatutPayload } from './validation/conseillers.inputs'
import {
  CreateDemarchePayload,
  UpdateStatutDemarchePayload
} from './validation/demarches.inputs'
import {
  AddFavoriOffresEmploiPayload,
  GetFavorisOffresEmploiQueryParams
} from './validation/favoris.inputs'
import {
  GetActionsByJeuneQueryParams,
  GetRendezVousJeuneQueryParams,
  PutNotificationTokenInput,
  TransfererConseillerPayload
} from './validation/jeunes.inputs'

@Controller('jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesController {
  constructor(
    private readonly getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler,
    private readonly updateNotificationTokenCommandHandler: UpdateNotificationTokenCommandHandler,
    private readonly getHomeJeuneHandler: GetHomeJeuneHandler,
    private readonly getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler,
    private readonly getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler,
    private readonly getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly getRendezVousJeuneQueryHandler: GetRendezVousJeuneQueryHandler,
    private readonly getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler,
    private readonly getFavorisOffresEmploiJeuneQueryHandler: GetFavorisOffresEmploiJeuneQueryHandler,
    private readonly addFavoriOffreEmploiCommandHandler: AddFavoriOffreEmploiCommandHandler,
    private readonly deleteFavoriCommandHandler: DeleteFavoriOffreEmploiCommandHandler,
    private readonly transfererJeunesConseillerCommandHandler: TransfererJeunesConseillerCommandHandler,
    private readonly deleteJeuneCommandHandler: DeleteJeuneCommandHandler,
    private readonly deleteJeuneInactifCommandHandler: DeleteJeuneInactifCommandHandler,
    private readonly getActionsPoleEmploiQueryHandler: GetActionsJeunePoleEmploiQueryHandler,
    private readonly getConseillersJeuneQueryHandler: GetConseillersJeuneQueryHandler,
    private readonly updateStatutDemarcheCommandHandler: UpdateStatutDemarcheCommandHandler,
    private readonly createDemarcheCommandHandler: CreateDemarcheCommandHandler
  ) {}

  @Get(':idJeune')
  @ApiResponse({
    type: DetailJeuneQueryModel
  })
  async getDetailJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<DetailJeuneQueryModel | undefined> {
    const result = await this.getDetailJeuneQueryHandler.execute(
      {
        idJeune
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Get(':idJeune/conseillers')
  @ApiResponse({
    type: HistoriqueConseillerJeuneQueryModel,
    isArray: true
  })
  async getConseillersJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<HistoriqueConseillerJeuneQueryModel[]> {
    const result = await this.getConseillersJeuneQueryHandler.execute(
      {
        idJeune
      },
      utilisateur
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiHeader({
    name: 'x-appversion',
    required: false
  })
  @Put(':idJeune/push-notification-token')
  async updateNotificationToken(
    @Param('idJeune') idJeune: string,
    @Body() putNotificationTokenInput: PutNotificationTokenInput,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Headers('x-appversion') appVersion?: string
  ): Promise<void> {
    const result = await this.updateNotificationTokenCommandHandler.execute(
      {
        idJeune,
        token: putNotificationTokenInput.registration_token,
        appVersion: appVersion
      },
      utilisateur
    )

    handleFailure(result)
  }

  @ApiOperation({
    summary: 'Deprecated (Mobile V1.2)',
    deprecated: true
  })
  @Get(':idJeune/home')
  async getHome(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneHomeQueryModel> {
    return this.getHomeJeuneHandler.execute({ idJeune }, utilisateur)
  }

  @Get(':idJeune/actions')
  @ApiResponse({
    type: ActionQueryModel,
    isArray: true
  })
  async getActions(
    @Res() response: Response,
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query() getActionsByJeuneQueryParams: GetActionsByJeuneQueryParams
  ): Promise<Response<ActionQueryModel[]>> {
    const query: GetActionsByJeuneQuery = {
      idJeune,
      page: getActionsByJeuneQueryParams.page,
      tri: getActionsByJeuneQueryParams.tri,
      statuts: getActionsByJeuneQueryParams.statuts
    }

    const result = await this.getActionsByJeuneQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      const leResultatEstPagine = Boolean(query.page)
      const statusCode = leResultatEstPagine
        ? HttpStatus.PARTIAL_CONTENT
        : HttpStatus.OK

      return response
        .set({
          'x-total-count': result.data.metadonnees.nombreTotal,
          'x-statut-in_progress-count': result.data.metadonnees.nombreEnCours,
          'x-statut-done-count': result.data.metadonnees.nombreTermine,
          'x-statut-canceled-count': result.data.metadonnees.nombreAnnule,
          'x-statut-not_started-count':
            result.data.metadonnees.nombrePasCommence,
          'x-page-size': result.data.metadonnees.nombreElementsParPage
        })
        .status(statusCode)
        .json(result.data.actions)
    }

    throw handleFailure(result)
  }

  @Get(':idJeune/home/actions')
  @ApiResponse({
    type: JeuneHomeActionQueryModel
  })
  async getHomeActions(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneHomeActionQueryModel> {
    return this.getJeuneHomeActionsQueryHandler.execute(
      { idJeune },
      utilisateur
    )
  }

  @Get(':idJeune/home/demarches')
  @ApiResponse({
    type: JeuneHomeDemarcheQueryModel
  })
  async getHomeDemarches(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<JeuneHomeDemarcheQueryModel> {
    const result = await this.getJeuneHomeDemarchesQueryHandler.execute(
      {
        idJeune,
        accessToken
      },
      utilisateur
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: "Modifie le statut d'une démarche"
  })
  @Put(':idJeune/demarches/:idDemarche/statut')
  async udpateStatutDemarche(
    @Param('idJeune') idJeune: string,
    @Param('idDemarche') idDemarche: string,
    @Body() updateDemarchePayload: UpdateStatutDemarchePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DemarcheQueryModel> {
    const command: UpdateStatutDemarcheCommand = {
      ...updateDemarchePayload,
      idJeune,
      idDemarche,
      accessToken
    }
    const result = await this.updateStatutDemarcheCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Crée une démarche',
    description: `Permet de créer une démarche personnalisée ou du référentiel PE.
    Dans le cas d'une démarche personnalisée il faut remplir dateFin et description.
    Dans le cas d'une démarche du référentiel il faut remplir dateFin, codeQuoi, codePourquoi et optionnellement codeComment.
    `
  })
  @Post(':idJeune/demarches')
  async createDemarche(
    @Param('idJeune') idJeune: string,
    @Body() createDemarchePayload: CreateDemarchePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DemarcheQueryModel> {
    const command: CreateDemarcheCommand = {
      ...createDemarchePayload,
      idJeune,
      accessToken
    }
    const result = await this.createDemarcheCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: 'Deprecated (Mobile V1.6)',
    deprecated: true
  })
  @Get(':idJeune/pole-emploi/actions')
  @ApiResponse({
    type: DemarcheQueryModel,
    isArray: true
  })
  async getActionsPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<DemarcheQueryModel[]> {
    const result = await this.getActionsPoleEmploiQueryHandler.execute(
      {
        idJeune,
        accessToken
      },
      utilisateur
    )
    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Get(':idJeune/rendezvous')
  @ApiResponse({
    type: RendezVousJeuneQueryModel,
    isArray: true
  })
  async getRendezVous(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getRendezVousQueryParams?: GetRendezVousJeuneQueryParams
  ): Promise<RendezVousJeuneQueryModel[]> {
    let result: Result<RendezVousJeuneQueryModel[]>
    if (utilisateur.structure === Core.Structure.POLE_EMPLOI && accessToken) {
      result = await this.getRendezVousJeunePoleEmploiQueryHandler.execute(
        {
          idJeune,
          accessToken,
          periode: getRendezVousQueryParams?.periode
        },
        utilisateur
      )
    } else {
      result = await this.getRendezVousJeuneQueryHandler.execute(
        {
          idJeune,
          periode: getRendezVousQueryParams?.periode
        },
        utilisateur
      )
    }

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Post(':idJeune/action')
  async postNouvelleAction(
    @Param('idJeune') idJeune: string,
    @Body() createActionPayload: CreateActionAvecStatutPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
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
    throw handleFailure(result)
  }

  // Deprecated (Mobile App v1.0.0)
  @Get(':idJeune/favoris')
  async getFavoris(
    @Param('idJeune') idJeune: string,
    @Query() getFavorisQuery: GetFavorisOffresEmploiQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<OffreEmploiResumeQueryModel[] | FavoriOffreEmploiIdQueryModel[]> {
    return this.getFavorisOffresEmploiJeuneQueryHandler.execute(
      {
        idJeune,
        detail: Boolean(getFavorisQuery.detail)
      },
      utilisateur
    )
  }

  // Deprecated (Mobile App v1.0.0)
  @Post(':idJeune/favori')
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
  @Delete(':idJeune/favori/:idOffreEmploi')
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

  @Post('transferer')
  @HttpCode(200)
  async transfererConseiller(
    @Body() transfererConseillerPayload: TransfererConseillerPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: TransfererJeunesConseillerCommand = {
      idConseillerSource: transfererConseillerPayload.idConseillerSource,
      idConseillerCible: transfererConseillerPayload.idConseillerCible,
      idsJeunes: transfererConseillerPayload.idsJeune,
      estTemporaire: Boolean(transfererConseillerPayload.estTemporaire),
      structure: utilisateur.structure
    }
    const result = await this.transfererJeunesConseillerCommandHandler.execute(
      command,
      utilisateur
    )

    handleFailure(result)
  }

  @Delete(':idJeune')
  @HttpCode(HttpStatus.NO_CONTENT)
  async supprimerJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    let result: Result

    switch (utilisateur.type) {
      case Authentification.Type.CONSEILLER:
        result = await this.deleteJeuneInactifCommandHandler.execute(
          {
            idConseiller: utilisateur.id,
            idJeune
          },
          utilisateur
        )
        break
      case Authentification.Type.JEUNE:
      case Authentification.Type.SUPPORT:
        result = await this.deleteJeuneCommandHandler.execute(
          {
            idJeune
          },
          utilisateur
        )
        break
      default:
        throw new ForbiddenException(
          "Vous n'avez pas le droit d'effectuer cette action"
        )
    }

    handleFailure(result)
  }
}
