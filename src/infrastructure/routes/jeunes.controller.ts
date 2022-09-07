import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res
} from '@nestjs/common'
import {
  ApiHeader,
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { Response } from 'express'
import { ArchiverJeuneCommandHandler } from '../../application/commands/archiver-jeune.command.handler'
import {
  CreateDemarcheCommand,
  CreateDemarcheCommandHandler
} from '../../application/commands/create-demarche.command.handler'
import { DeleteJeuneCommandHandler } from '../../application/commands/delete-jeune.command.handler'
import {
  TransfererJeunesConseillerCommand,
  TransfererJeunesConseillerCommandHandler
} from '../../application/commands/transferer-jeunes-conseiller.command.handler'
import { GetDemarchesQueryHandler } from '../../application/queries/get-demarches.query.handler'
import { GetDetailJeuneQueryHandler } from '../../application/queries/get-detail-jeune.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import {
  JeuneHomeActionQueryModel,
  JeuneHomeDemarcheQueryModel,
  JeuneHomeQueryModel
} from '../../application/queries/query-models/home-jeune.query-model'
import {
  DetailJeuneQueryModel,
  HistoriqueConseillerJeuneQueryModel,
  PreferencesJeuneQueryModel
} from '../../application/queries/query-models/jeunes.query-model'
import { RendezVousJeuneQueryModel } from '../../application/queries/query-models/rendez-vous.query-model'
import { Core } from '../../domain/core'
import { DateService } from '../../utils/date-service'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from '../../application/commands/create-action.command.handler'
import { DeleteJeuneInactifCommandHandler } from '../../application/commands/delete-jeune-inactif.command.handler'
import {
  UpdateStatutDemarcheCommand,
  UpdateStatutDemarcheCommandHandler
} from '../../application/commands/update-demarche.command.handler'
import { UpdateJeuneConfigurationApplicationCommandHandler } from '../../application/commands/update-jeune-configuration-application.command.handler'
import { UpdateJeunePreferencesCommandHandler } from '../../application/commands/update-preferences-jeune.command.handler'
import {
  GetActionsByJeuneQuery,
  GetActionsByJeuneQueryHandler
} from '../../application/queries/get-actions-by-jeune.query.handler.db'
import { GetConseillersJeuneQueryHandler } from '../../application/queries/get-conseillers-jeune.query.handler.db'
import { GetHomeJeuneHandler } from '../../application/queries/get-home-jeune.query.handler'
import { GetJeuneHomeActionsQueryHandler } from '../../application/queries/get-jeune-home-actions.query.handler'
import { GetJeuneHomeDemarchesQueryHandler } from '../../application/queries/get-jeune-home-demarches.query.handler'
import {
  GetPreferencesJeuneQuery,
  GetPreferencesJeuneQueryHandler
} from '../../application/queries/get-preferences-jeune.handler.db'
import { GetRendezVousJeuneQueryHandler } from '../../application/queries/get-rendez-vous-jeune.query.handler.db'
import {
  ActionQueryModel,
  DemarcheQueryModel
} from '../../application/queries/query-models/actions.query-model'
import {
  isFailure,
  isSuccess,
  Result
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action/action'
import { Authentification } from '../../domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import { CreateActionParLeJeunePayload } from './validation/actions.inputs'
import {
  CreateDemarchePayload,
  UpdateStatutDemarchePayload
} from './validation/demarches.inputs'
import {
  ArchiverJeunePayload,
  GetActionsByJeuneQueryParams,
  GetJeuneHomeSuiviQueryParams,
  GetRendezVousJeuneQueryParams,
  PutNotificationTokenInput,
  TransfererConseillerPayload,
  UpdateJeunePreferencesPayload
} from './validation/jeunes.inputs'
import {
  JeuneHomeAgendaPoleEmploiQueryModel,
  JeuneHomeEvenementsQueryModel
} from '../../application/queries/query-models/home-jeune-suivi.query-model'
import { GetJeuneHomeAgendaQueryHandler } from '../../application/queries/get-jeune-home-agenda.query.db'
import { GetJeuneHomeAgendaPoleEmploiQueryHandler } from '../../application/queries/get-jeune-home-agenda-pole-emploi.query.handler'

@Controller('jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesController {
  constructor(
    private readonly dateService: DateService,
    private readonly getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler,
    private readonly updateJeuneConfigurationApplicationCommandHandler: UpdateJeuneConfigurationApplicationCommandHandler,
    private readonly getHomeJeuneHandler: GetHomeJeuneHandler,
    private readonly getActionsByJeuneQueryHandler: GetActionsByJeuneQueryHandler,
    private readonly getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler,
    private readonly getJeuneHomeSuiviQueryHandler: GetJeuneHomeAgendaQueryHandler,
    private readonly getJeuneHomeAgendaPoleEmploiQueryHandler: GetJeuneHomeAgendaPoleEmploiQueryHandler,
    private readonly getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly getRendezVousJeuneQueryHandler: GetRendezVousJeuneQueryHandler,
    private readonly getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler,
    private readonly transfererJeunesConseillerCommandHandler: TransfererJeunesConseillerCommandHandler,
    private readonly deleteJeuneCommandHandler: DeleteJeuneCommandHandler,
    private readonly archiverJeuneCommandHandler: ArchiverJeuneCommandHandler,
    private readonly deleteJeuneInactifCommandHandler: DeleteJeuneInactifCommandHandler,
    private readonly getDemarchesQueryHandler: GetDemarchesQueryHandler,
    private readonly getConseillersJeuneQueryHandler: GetConseillersJeuneQueryHandler,
    private readonly updateStatutDemarcheCommandHandler: UpdateStatutDemarcheCommandHandler,
    private readonly createDemarcheCommandHandler: CreateDemarcheCommandHandler,
    private readonly updateJeunePreferencesCommandHandler: UpdateJeunePreferencesCommandHandler,
    private readonly getPreferencesJeuneQueryHandler: GetPreferencesJeuneQueryHandler
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

  @ApiOperation({
    summary: 'Deprecated (Mobile V1.8)',
    deprecated: true
  })
  @ApiHeader({
    name: 'x-appversion',
    required: false
  })
  @ApiHeader({
    name: 'x-installationid',
    required: false
  })
  @Put(':idJeune/push-notification-token')
  async updateNotificationToken(
    @Param('idJeune') idJeune: string,
    @Body() putNotificationTokenInput: PutNotificationTokenInput,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Headers('x-appversion') appVersion?: string,
    @Headers('x-installationid') installationId?: string
  ): Promise<void> {
    const result =
      await this.updateJeuneConfigurationApplicationCommandHandler.execute(
        {
          idJeune,
          pushNotificationToken: putNotificationTokenInput.registration_token,
          appVersion,
          installationId
        },
        utilisateur
      )

    handleFailure(result)
  }

  @ApiHeader({
    name: 'x-appversion',
    required: false
  })
  @ApiHeader({
    name: 'x-installationid',
    required: false
  })
  @Put(':idJeune/configuration-application')
  async updateConfiguration(
    @Param('idJeune') idJeune: string,
    @Body() putNotificationTokenInput: PutNotificationTokenInput,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Headers('x-appversion') appVersion?: string,
    @Headers('x-installationid') installationId?: string
  ): Promise<void> {
    const result =
      await this.updateJeuneConfigurationApplicationCommandHandler.execute(
        {
          idJeune,
          pushNotificationToken: putNotificationTokenInput.registration_token,
          appVersion,
          installationId
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

  @ApiOperation({
    summary: 'Deprecated (Mobile)',
    deprecated: true
  })
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
          'x-statut-done-count': result.data.metadonnees.nombreTerminees,
          'x-statut-canceled-count': result.data.metadonnees.nombreAnnulees,
          'x-statut-not_started-count':
            result.data.metadonnees.nombrePasCommencees,
          'x-page-size': result.data.metadonnees.nombreActionsParPage
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

  @Get(':idJeune/home/agenda')
  @ApiResponse({
    type: JeuneHomeEvenementsQueryModel
  })
  async getHomeAgenda(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: GetJeuneHomeSuiviQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneHomeEvenementsQueryModel> {
    const result = await this.getJeuneHomeSuiviQueryHandler.execute(
      { idJeune, maintenant: queryParams.maintenant },
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }

    return result.data
  }

  @Get(':idJeune/home/agenda/pole-emploi')
  @ApiResponse({
    type: JeuneHomeAgendaPoleEmploiQueryModel
  })
  async getHomeAgendaPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: GetJeuneHomeSuiviQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<JeuneHomeAgendaPoleEmploiQueryModel> {
    const result = await this.getJeuneHomeAgendaPoleEmploiQueryHandler.execute(
      { idJeune, maintenant: queryParams.maintenant, accessToken },
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }

    return result.data
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
    const result = await this.getDemarchesQueryHandler.execute(
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
    @Body() createActionPayload: CreateActionParLeJeunePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: CreateActionCommand = {
      contenu: createActionPayload.content,
      idJeune,
      idCreateur: idJeune,
      typeCreateur: Action.TypeCreateur.JEUNE,
      commentaire: createActionPayload.comment,
      statut: createActionPayload.status,
      dateEcheance:
        createActionPayload.dateEcheance ??
        this.buildDateEcheanceV1(createActionPayload.status),
      rappel: createActionPayload.dateEcheance
        ? createActionPayload.rappel
        : false
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

  @Post(':idJeune/archiver')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiverJeune(
    @Param('idJeune') idJeune: string,
    @Body() archiverJeunePayload: ArchiverJeunePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.archiverJeuneCommandHandler.execute(
      {
        idJeune,
        motif: archiverJeunePayload.motif,
        commentaire: archiverJeunePayload.commentaire
      },
      utilisateur
    )
    handleFailure(result)
  }

  @ApiOperation({
    summary: 'Modifie les préférences de partage des informations du jeune'
  })
  @Put(':idJeune/preferences')
  async udpateJeunePreferences(
    @Param('idJeune') idJeune: string,
    @Body() updateJeunePreferencesPayload: UpdateJeunePreferencesPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command = {
      idJeune,
      partageFavoris: updateJeunePreferencesPayload.partageFavoris
    }
    const result = await this.updateJeunePreferencesCommandHandler.execute(
      command,
      utilisateur
    )
    handleFailure(result)
  }

  @ApiOperation({
    summary: 'Récupère les préférences de partage des informations du jeune'
  })
  @Get(':idJeune/preferences')
  async getPreferencesJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<PreferencesJeuneQueryModel> {
    const query: GetPreferencesJeuneQuery = {
      idJeune
    }
    const result = await this.getPreferencesJeuneQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  private buildDateEcheanceV1(statutAction?: Action.Statut): Date {
    const statutsDone = [Action.Statut.ANNULEE, Action.Statut.TERMINEE]

    const now = this.dateService.now().set({ second: 59, millisecond: 0 })
    const nowJs = now.toJSDate()

    if (statutAction && statutsDone.includes(statutAction)) {
      return nowJs
    }
    return now.plus({ months: 3 }).toJSDate()
  }
}
