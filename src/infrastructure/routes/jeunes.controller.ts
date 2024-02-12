import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query
} from '@nestjs/common'
import {
  ApiHeader,
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger'
import { ArchiverJeuneCommandHandler } from 'src/application/commands/archiver-jeune.command.handler'
import {
  CreateDemarcheCommand,
  CreateDemarcheCommandHandler
} from 'src/application/commands/pole-emploi/create-demarche.command.handler'
import { DeleteJeuneCommandHandler } from 'src/application/commands/delete-jeune.command.handler'
import {
  TransfererJeunesConseillerCommand,
  TransfererJeunesConseillerCommandHandler
} from 'src/application/commands/transferer-jeunes-conseiller.command.handler'
import { GetDetailJeuneQueryHandler } from 'src/application/queries/get-detail-jeune.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from 'src/application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import {
  JeuneHomeActionQueryModel,
  JeuneHomeDemarcheQueryModel
} from 'src/application/queries/query-models/home-jeune.query-model'
import {
  DetailJeuneQueryModel,
  HistoriqueConseillerJeuneQueryModel,
  PreferencesJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-model'
import {
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModel
} from 'src/application/queries/query-models/rendez-vous.query-model'
import { Core, estPoleEmploiBRSA } from 'src/domain/core'
import { DateService } from 'src/utils/date-service'
import {
  CreateActionCommand,
  CreateActionCommandHandler
} from 'src/application/commands/action/create-action.command.handler'
import { DeleteJeuneInactifCommandHandler } from 'src/application/commands/delete-jeune-inactif.command.handler'
import {
  UpdateStatutDemarcheCommand,
  UpdateStatutDemarcheCommandHandler
} from 'src/application/commands/pole-emploi/update-demarche.command.handler'
import { UpdateJeuneConfigurationApplicationCommandHandler } from 'src/application/commands/update-jeune-configuration-application.command.handler'
import { UpdateJeunePreferencesCommandHandler } from 'src/application/commands/update-preferences-jeune.command.handler'
import { GetConseillersJeuneQueryHandler } from 'src/application/queries/get-conseillers-jeune.query.handler.db'
import { GetJeuneHomeActionsQueryHandler } from 'src/application/queries/get-jeune-home-actions.query.handler'
import { GetJeuneHomeDemarchesQueryHandler } from 'src/application/queries/get-jeune-home-demarches.query.handler'
import {
  GetPreferencesJeuneQuery,
  GetPreferencesJeuneQueryHandler
} from 'src/application/queries/get-preferences-jeune.handler.db'
import { GetRendezVousJeuneQueryHandler } from 'src/application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import { DemarcheQueryModel } from 'src/application/queries/query-models/actions.query-model'
import { isFailure, isSuccess, Result } from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Authentification } from 'src/domain/authentification'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './result.handler'
import { CreateActionParLeJeunePayload } from './validation/actions.inputs'
import {
  CreateDemarchePayload,
  UpdateStatutDemarchePayload
} from './validation/demarches.inputs'
import {
  ArchiverJeunePayload,
  GetRendezVousJeuneQueryParams,
  MaintenantQueryParams,
  TransfererConseillerPayload,
  UpdateConfigurationInput,
  UpdateJeunePreferencesPayload
} from './validation/jeunes.inputs'
import {
  SuiviSemainePoleEmploiQueryModel,
  JeuneHomeAgendaQueryModel
} from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { GetJeuneHomeAgendaQueryHandler } from 'src/application/queries/get-jeune-home-agenda.query.handler.db'
import { GetSuiviSemainePoleEmploiQueryHandler } from 'src/application/queries/get-suivi-semaine-pole-emploi.query.handler'
import { DateTime } from 'luxon'
import { toDemarcheQueryModel } from 'src/application/queries/query-mappers/demarche.mappers'
import {
  GetAnimationsCollectivesJeuneQuery,
  GetAnimationsCollectivesJeuneQueryHandler
} from 'src/application/queries/rendez-vous/get-animations-collectives-jeune.query.handler.db'
import { GetUnRendezVousJeuneQueryHandler } from 'src/application/queries/rendez-vous/get-un-rendez-vous-jeune.query.handler.db'
import { IdQueryModel } from 'src/application/queries/query-models/common.query-models'

@Controller('jeunes')
@ApiOAuth2([])
@ApiTags('Jeunes')
export class JeunesController {
  constructor(
    private readonly dateService: DateService,
    private readonly getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler,
    private readonly updateJeuneConfigurationApplicationCommandHandler: UpdateJeuneConfigurationApplicationCommandHandler,
    private readonly getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler,
    private readonly getJeuneHomeSuiviQueryHandler: GetJeuneHomeAgendaQueryHandler,
    private readonly getJeuneHomeAgendaPoleEmploiQueryHandler: GetSuiviSemainePoleEmploiQueryHandler,
    private readonly getJeuneHomeDemarchesQueryHandler: GetJeuneHomeDemarchesQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly getRendezVousJeuneQueryHandler: GetRendezVousJeuneQueryHandler,
    private readonly getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler,
    private readonly transfererJeunesConseillerCommandHandler: TransfererJeunesConseillerCommandHandler,
    private readonly deleteJeuneCommandHandler: DeleteJeuneCommandHandler,
    private readonly archiverJeuneCommandHandler: ArchiverJeuneCommandHandler,
    private readonly deleteJeuneInactifCommandHandler: DeleteJeuneInactifCommandHandler,
    private readonly getConseillersJeuneQueryHandler: GetConseillersJeuneQueryHandler,
    private readonly updateStatutDemarcheCommandHandler: UpdateStatutDemarcheCommandHandler,
    private readonly createDemarcheCommandHandler: CreateDemarcheCommandHandler,
    private readonly updateJeunePreferencesCommandHandler: UpdateJeunePreferencesCommandHandler,
    private readonly getPreferencesJeuneQueryHandler: GetPreferencesJeuneQueryHandler,
    private readonly getAnimationsCollectivesJeuneQueryHandler: GetAnimationsCollectivesJeuneQueryHandler,
    private readonly getUnRendezVousJeuneQueryHandler: GetUnRendezVousJeuneQueryHandler
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
  @ApiHeader({
    name: 'x-installationid',
    required: false
  })
  @ApiHeader({
    name: 'x-instanceid',
    required: false
  })
  @Put(':idJeune/configuration-application')
  async updateConfiguration(
    @Param('idJeune') idJeune: string,
    @Body() updateConfigurationInput: UpdateConfigurationInput,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Headers('x-appversion') appVersion?: string,
    @Headers('x-installationid') installationId?: string,
    @Headers('x-instanceid') instanceId?: string
  ): Promise<void> {
    const result =
      await this.updateJeuneConfigurationApplicationCommandHandler.execute(
        {
          idJeune,
          pushNotificationToken: updateConfigurationInput.registration_token,
          appVersion,
          installationId,
          instanceId,
          fuseauHoraire: updateConfigurationInput.fuseauHoraire
        },
        utilisateur
      )

    handleFailure(result)
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
    type: JeuneHomeAgendaQueryModel
  })
  async getHomeAgenda(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: MaintenantQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<JeuneHomeAgendaQueryModel> {
    const result = await this.getJeuneHomeSuiviQueryHandler.execute(
      {
        idJeune,
        maintenant: queryParams.maintenant,
        accessToken: accessToken
      },
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }

    return result.data
  }

  @Get(':idJeune/home/agenda/pole-emploi')
  @ApiResponse({
    type: SuiviSemainePoleEmploiQueryModel
  })
  @ApiOperation({
    deprecated: true,
    description: "Route utilisée par l'app mobile version 2.3.0 et moins"
  })
  async getHomeAgendaPoleEmploi(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: MaintenantQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string
  ): Promise<SuiviSemainePoleEmploiQueryModel> {
    const maintenant = DateTime.fromISO(queryParams.maintenant, {
      setZone: true
    })
    const result = await this.getJeuneHomeAgendaPoleEmploiQueryHandler.execute(
      { idJeune, maintenant, accessToken },
      utilisateur
    )

    if (isFailure(result)) {
      throw handleFailure(result)
    }

    if (result.data.dateDuCache) {
      throw new InternalServerErrorException(
        'Les données de Pôle emploi sont inaccessibles'
      )
    }

    return result.data.queryModel
  }

  @Get(':idJeune/home/demarches')
  @ApiResponse({
    type: JeuneHomeDemarcheQueryModel
  })
  @ApiOperation({
    deprecated: true,
    description: "Route utilisée par l'app mobile version 2.3.0 et moins"
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
    if (isFailure(result)) {
      throw handleFailure(result)
    }

    if (result.data.dateDuCache) {
      throw new InternalServerErrorException(
        'Les données de Pôle emploi sont inaccessibles'
      )
    }

    return result.data.queryModel
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
      dateFin: DateTime.fromISO(updateDemarchePayload.dateFin, {
        setZone: true
      }),
      dateDebut: updateDemarchePayload.dateDebut
        ? DateTime.fromISO(updateDemarchePayload.dateDebut, { setZone: true })
        : undefined,
      idJeune,
      idDemarche,
      accessToken
    }
    const result = await this.updateStatutDemarcheCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return toDemarcheQueryModel(result.data)
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
      dateFin: DateTime.fromISO(createDemarchePayload.dateFin, {
        setZone: true
      }),
      idJeune,
      accessToken
    }
    const result = await this.createDemarcheCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return toDemarcheQueryModel(result.data)
    }
    throw handleFailure(result)
  }

  @Get(':idJeune/rendezvous')
  @ApiResponse({
    type: RendezVousJeuneQueryModel,
    isArray: true
  })
  @ApiOperation({
    deprecated: true,
    description: "Route utilisée par l'app mobile version 2.3.0 et moins"
  })
  async getRendezVous(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getRendezVousQueryParams?: GetRendezVousJeuneQueryParams
  ): Promise<RendezVousJeuneQueryModel[]> {
    if (estPoleEmploiBRSA(utilisateur.structure) && accessToken) {
      const result =
        await this.getRendezVousJeunePoleEmploiQueryHandler.execute(
          {
            idJeune,
            accessToken,
            periode: getRendezVousQueryParams?.periode
          },
          utilisateur
        )
      if (isFailure(result)) {
        throw handleFailure(result)
      }

      if (result.data.dateDuCache) {
        throw new InternalServerErrorException(
          'Les données de Pôle emploi sont inaccessibles'
        )
      }

      return result.data.queryModel
    } else {
      const result = await this.getRendezVousJeuneQueryHandler.execute(
        {
          idJeune,
          periode: getRendezVousQueryParams?.periode
        },
        utilisateur
      )
      if (isSuccess(result)) {
        return result.data
      }
      throw handleFailure(result)
    }
  }

  @Get(':idJeune/rendezvous/:idRendezVous')
  @ApiResponse({
    type: RendezVousJeuneDetailQueryModel
  })
  async getDetailRendezVous(
    @Param('idJeune') idJeune: string,
    @Param('idRendezVous', new ParseUUIDPipe()) idRendezVous: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousJeuneDetailQueryModel> {
    const result = await this.getUnRendezVousJeuneQueryHandler.execute(
      { idRendezVous, idJeune },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @Post(':idJeune/action')
  @ApiResponse({
    type: IdQueryModel
  })
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
      dateEcheance: createActionPayload.dateEcheance
        ? DateTime.fromISO(createActionPayload.dateEcheance, { setZone: true })
        : this.buildDateEcheanceV1(createActionPayload.status),
      rappel: createActionPayload.dateEcheance
        ? createActionPayload.rappel
        : false,
      codeQualification: createActionPayload.codeQualification
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
      provenanceUtilisateur: Authentification.Type.CONSEILLER
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

  @ApiOperation({
    summary: 'Récupère la liste des animations collectives de l‘agence du jeune'
  })
  @Get(':idJeune/animations-collectives')
  async getAnimationsCollectivesJeune(
    @Param('idJeune') idJeune: string,
    @Query() queryParams: MaintenantQueryParams,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousJeuneDetailQueryModel[]> {
    const maintenant = DateTime.fromISO(queryParams.maintenant, {
      setZone: true
    })
    const query: GetAnimationsCollectivesJeuneQuery = {
      idJeune,
      maintenant
    }
    const result = await this.getAnimationsCollectivesJeuneQueryHandler.execute(
      query,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  private buildDateEcheanceV1(statutAction?: Action.Statut): DateTime {
    const statutsDone = [Action.Statut.ANNULEE, Action.Statut.TERMINEE]

    const now = this.dateService.now().set({ second: 59, millisecond: 0 })

    if (statutAction && statutsDone.includes(statutAction)) {
      return now
    }
    return now.plus({ months: 3 })
  }
}
