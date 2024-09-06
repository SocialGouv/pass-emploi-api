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
  Patch,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ArchiverJeuneCommandHandler } from 'src/application/commands/archiver-jeune.command.handler'
import { DeleteJeuneInactifCommandHandler } from 'src/application/commands/delete-jeune-inactif.command.handler'
import { DeleteJeuneCommandHandler } from 'src/application/commands/delete-jeune.command.handler'
import {
  TransfererJeunesConseillerCommand,
  TransfererJeunesConseillerCommandHandler
} from 'src/application/commands/transferer-jeunes-conseiller.command.handler'
import { UpdateJeuneConfigurationApplicationCommandHandler } from 'src/application/commands/update-jeune-configuration-application.command.handler'
import { UpdateJeunePreferencesCommandHandler } from 'src/application/commands/update-preferences-jeune.command.handler'
import { GetConseillersJeuneQueryHandler } from 'src/application/queries/get-conseillers-jeune.query.handler.db'
import { GetDetailJeuneQueryHandler } from 'src/application/queries/get-detail-jeune.query.handler.db'
import { GetJeuneHomeActionsQueryHandler } from 'src/application/queries/get-jeune-home-actions.query.handler'
import { GetJeuneHomeAgendaQueryHandler } from 'src/application/queries/get-jeune-home-agenda.query.handler.db'
import {
  GetPreferencesJeuneQuery,
  GetPreferencesJeuneQueryHandler
} from 'src/application/queries/get-preferences-jeune.query.handler.db'
import { JeuneHomeAgendaQueryModel } from 'src/application/queries/query-models/home-jeune-suivi.query-model'
import { JeuneHomeActionQueryModel } from 'src/application/queries/query-models/home-jeune.query-model'
import {
  DetailJeuneQueryModel,
  HistoriqueConseillerJeuneQueryModel,
  PreferencesJeuneQueryModel
} from 'src/application/queries/query-models/jeunes.query-model'
import { ResultatsRechercheMessageQueryModel } from 'src/application/queries/query-models/resultats-recherche-message-query.model'
import { RechercherMessageQueryHandler } from 'src/application/queries/rechercher-message.query.handler'
import { Result } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { RechercherMessagePayload } from 'src/infrastructure/routes/validation/messages.input'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import {
  ArchiverJeunePayload,
  MaintenantQueryParams,
  TransfererConseillerPayload,
  UpdateConfigurationInput,
  UpdateJeunePayload,
  UpdateJeunePreferencesPayload
} from './validation/jeunes.inputs'
import { UpdateJeuneCommandHandler } from '../../application/commands/update-jeune.command.handler'

@Controller('jeunes')
@CustomSwaggerApiOAuth2()
@ApiTags('Jeunes')
export class JeunesController {
  constructor(
    private readonly getDetailJeuneQueryHandler: GetDetailJeuneQueryHandler,
    private readonly updateJeuneConfigurationApplicationCommandHandler: UpdateJeuneConfigurationApplicationCommandHandler,
    private readonly updateJeuneCommandHandler: UpdateJeuneCommandHandler,
    private readonly getJeuneHomeActionsQueryHandler: GetJeuneHomeActionsQueryHandler,
    private readonly getJeuneHomeSuiviQueryHandler: GetJeuneHomeAgendaQueryHandler,
    private readonly transfererJeunesConseillerCommandHandler: TransfererJeunesConseillerCommandHandler,
    private readonly deleteJeuneCommandHandler: DeleteJeuneCommandHandler,
    private readonly archiverJeuneCommandHandler: ArchiverJeuneCommandHandler,
    private readonly deleteJeuneInactifCommandHandler: DeleteJeuneInactifCommandHandler,
    private readonly getConseillersJeuneQueryHandler: GetConseillersJeuneQueryHandler,
    private readonly updateJeunePreferencesCommandHandler: UpdateJeunePreferencesCommandHandler,
    private readonly getPreferencesJeuneQueryHandler: GetPreferencesJeuneQueryHandler,
    private rechercherMessageCommandHandler: RechercherMessageQueryHandler
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
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
      partageFavoris: updateJeunePreferencesPayload.partageFavoris,
      alertesOffres: updateJeunePreferencesPayload.alertesOffres,
      messages: updateJeunePreferencesPayload.messages,
      creationActionConseiller:
        updateJeunePreferencesPayload.creationActionConseiller,
      rendezVousSessions: updateJeunePreferencesPayload.rendezVousSessions,
      rappelActions: updateJeunePreferencesPayload.rappelActions
    }
    const result = await this.updateJeunePreferencesCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Modifie les infos du jeune'
  })
  @Patch(':idJeune')
  async udpateJeune(
    @Param('idJeune') idJeune: string,
    @Body() updateJeunePayload: UpdateJeunePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command = {
      idJeune,
      dateSignatureCGU: updateJeunePayload.dateSignatureCGU
    }
    const result = await this.updateJeuneCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
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

    return handleResult(result)
  }

  @Get(':idJeune/messages')
  @ApiOperation({
    summary: 'Recherche un mot-clé dans une conversation',
    description: 'Autorisé pour un conseiller'
  })
  @ApiResponse({
    type: ResultatsRechercheMessageQueryModel
  })
  async rechercherMessage(
    @Param('idJeune') idJeune: string,
    @Query() query: RechercherMessagePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ResultatsRechercheMessageQueryModel> {
    const result = await this.rechercherMessageCommandHandler.execute(
      {
        recherche: query.recherche,
        idBeneficiaire: idJeune
      },
      utilisateur
    )

    return handleResult(result)
  }
}
