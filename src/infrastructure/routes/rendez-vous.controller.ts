import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from '../../application/commands/create-rendez-vous.command.handler'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../application/commands/delete-rendez-vous.command.handler.db'
import {
  SendNotificationsNouveauxMessagesCommand,
  SendNotificationsNouveauxMessagesCommandHandler
} from '../../application/commands/send-notifications-nouveaux-messages.command.handler'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from '../../application/commands/update-rendez-vous.command.handler'
import {
  RendezVousConseillerDetailQueryModel,
  RendezVousConseillerFutursEtPassesQueryModel,
  RendezVousConseillerQueryModel,
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModelV2
} from '../../application/queries/query-models/rendez-vous.query-model'
import {
  GetAnimationsCollectivesJeuneQuery,
  GetAnimationsCollectivesJeuneQueryHandler
} from '../../application/queries/rendez-vous/get-animations-collectives-jeune.query.handler.db'
import { GetDetailRendezVousJeuneQueryHandler } from '../../application/queries/rendez-vous/get-detail-rendez-vous-jeune.query.handler.db'
import { GetDetailRendezVousQueryHandler } from '../../application/queries/rendez-vous/get-detail-rendez-vous.query.handler.db'
import {
  GetRendezVousConseillerPaginesQuery,
  GetRendezVousConseillerPaginesQueryHandler
} from '../../application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { GetAllRendezVousConseillerQueryHandler } from '../../application/queries/rendez-vous/get-rendez-vous-conseiller.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { GetRendezVousJeuneQueryHandler } from '../../application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import {
  Result,
  isFailure,
  isSuccess
} from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core, estPoleEmploiBRSA } from '../../domain/core'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './result.handler'
import {
  EnvoyerNotificationsPayload,
  GetRendezVousConseillerQueryParams,
  GetRendezVousConseillerV2QueryParams
} from './validation/conseillers.inputs'
import {
  GetRendezVousJeuneQueryParams,
  MaintenantQueryParams
} from './validation/jeunes.inputs'
import {
  CreateRendezVousPayload,
  UpdateRendezVousPayload
} from './validation/rendez-vous.inputs'

@Controller()
@ApiOAuth2([])
@ApiTags(
  'Rendez-vous du CEJ pour Milo / Pass Emploi (uniquement GET liste pour PE)'
)
export class RendezVousController {
  constructor(
    private readonly getDetailRendezVousQueryHandler: GetDetailRendezVousQueryHandler,
    private readonly deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler,
    private readonly updateRendezVousCommandHandler: UpdateRendezVousCommandHandler,
    private readonly sendNotificationsNouveauxMessages: SendNotificationsNouveauxMessagesCommandHandler,
    private readonly getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler,
    private readonly createRendezVousCommandHandler: CreateRendezVousCommandHandler,
    private readonly getRendezVousConseillerPaginesQueryHandler: GetRendezVousConseillerPaginesQueryHandler,
    private readonly getRendezVousJeuneQueryHandler: GetRendezVousJeuneQueryHandler,
    private readonly getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler,
    private readonly getDetailRendezVousJeuneQueryHandler: GetDetailRendezVousJeuneQueryHandler,
    private readonly getAnimationsCollectivesJeuneQueryHandler: GetAnimationsCollectivesJeuneQueryHandler
  ) {}

  @Get('rendezvous/:idRendezVous')
  @ApiResponse({
    type: RendezVousConseillerQueryModel
  })
  async getDetailRendezVous(
    @Param('idRendezVous', new ParseUUIDPipe()) idRendezVous: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousConseillerDetailQueryModel> {
    const result = await this.getDetailRendezVousQueryHandler.execute(
      {
        idRendezVous
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @Delete('rendezvous/:idRendezVous')
  @HttpCode(204)
  async deleteRendezVous(
    @Param('idRendezVous', new ParseUUIDPipe()) idRendezVous: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: DeleteRendezVousCommand = {
      idRendezVous
    }
    const result = await this.deleteRendezVousCommandHandler.execute(
      command,
      utilisateur
    )
    handleFailure(result)
  }

  @Put('rendezvous/:idRendezVous')
  async updateRendezVous(
    @Param('idRendezVous', new ParseUUIDPipe()) idRendezVous: string,
    @Body() updateRendezVousPayload: UpdateRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: UpdateRendezVousCommand = {
      idRendezVous: idRendezVous,
      idsJeunes: updateRendezVousPayload.jeunesIds,
      titre: updateRendezVousPayload.titre,
      commentaire: updateRendezVousPayload.comment,
      date: updateRendezVousPayload.date,
      duree: updateRendezVousPayload.duration,
      modalite: updateRendezVousPayload.modality,
      adresse: updateRendezVousPayload.adresse,
      organisme: updateRendezVousPayload.organisme,
      presenceConseiller: updateRendezVousPayload.presenceConseiller,
      nombreMaxParticipants: updateRendezVousPayload.nombreMaxParticipants
    }

    const result = await this.updateRendezVousCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: "Récupère les rendez-vous d'un conseiller",
    description: 'Autorisé pour un conseiller'
  })
  @Get('conseillers/:idConseiller/rendezvous')
  @ApiResponse({
    type: RendezVousConseillerFutursEtPassesQueryModel
  })
  async getRendezVous(
    @Query() getRendezVousConseillerQuery: GetRendezVousConseillerQueryParams,
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousConseillerFutursEtPassesQueryModel> {
    return this.getAllRendezVousConseillerQueryHandler.execute(
      {
        idConseiller,
        presenceConseiller: getRendezVousConseillerQuery.presenceConseiller
      },
      utilisateur
    )
  }

  @ApiOperation({
    summary: "Envoie une notification d'un nouveau message à des jeunes",
    description: 'Autorisé pour un conseiller'
  })
  @Post('conseillers/:idConseiller/jeunes/notify-messages')
  async postNotifications(
    @Param('idConseiller') idConseiller: string,
    @Body() envoyerNotificationsPayload: EnvoyerNotificationsPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: SendNotificationsNouveauxMessagesCommand = {
      idsJeunes: envoyerNotificationsPayload.idsJeunes,
      idConseiller
    }
    const result = await this.sendNotificationsNouveauxMessages.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      throw new RuntimeException()
    }
  }

  @ApiOperation({
    summary: 'Crée un rendez-vous pour des jeunes',
    description: 'Autorisé pour un conseiller'
  })
  @Post('conseillers/:idConseiller/rendezvous')
  async createRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Body() createRendezVousPayload: CreateRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: CreateRendezVousCommand = {
      idsJeunes: createRendezVousPayload.jeunesIds,
      commentaire: createRendezVousPayload.comment,
      date: createRendezVousPayload.date,
      duree: createRendezVousPayload.duration,
      idConseiller: idConseiller,
      modalite: createRendezVousPayload.modality,
      titre: createRendezVousPayload.titre,
      type: createRendezVousPayload.type,
      precision: createRendezVousPayload.precision,
      adresse: createRendezVousPayload.adresse,
      organisme: createRendezVousPayload.organisme,
      presenceConseiller: createRendezVousPayload.presenceConseiller,
      invitation: createRendezVousPayload.invitation,
      nombreMaxParticipants: createRendezVousPayload.nombreMaxParticipants
    }

    const result: Result<string> =
      await this.createRendezVousCommandHandler.execute(command, utilisateur)

    if (isSuccess(result)) {
      return { id: result.data }
    }
    throw handleFailure(result)
  }

  @ApiOperation({
    summary: "Récupère les rendez-vous d'un conseiller",
    description: 'Autorisé pour un conseiller'
  })
  @Get('v2/conseillers/:idConseiller/rendezvous')
  @ApiResponse({
    type: RendezVousConseillerQueryModel,
    isArray: true
  })
  @HttpCode(HttpStatus.PARTIAL_CONTENT)
  async getRendezVousV2(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query()
    getRendezVousConseillerQueryParams: GetRendezVousConseillerV2QueryParams
  ): Promise<RendezVousConseillerQueryModel[]> {
    const query: GetRendezVousConseillerPaginesQuery = {
      idConseiller,
      tri: getRendezVousConseillerQueryParams.tri,
      dateDebut: getRendezVousConseillerQueryParams.dateDebut,
      dateFin: getRendezVousConseillerQueryParams.dateFin,
      presenceConseiller: getRendezVousConseillerQueryParams.presenceConseiller
    }

    const result =
      await this.getRendezVousConseillerPaginesQueryHandler.execute(
        query,
        utilisateur
      )

    if (isSuccess(result)) {
      return result.data
    }

    throw handleFailure(result)
  }

  @Get('jeunes/:idJeune/rendezvous/:idRendezVous')
  @ApiResponse({
    type: RendezVousJeuneDetailQueryModel
  })
  async getDetailRendezVousJeune(
    @Param('idJeune') idJeune: string,
    @Param('idRendezVous', new ParseUUIDPipe()) idRendezVous: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousJeuneDetailQueryModel> {
    const result = await this.getDetailRendezVousJeuneQueryHandler.execute(
      { idRendezVous, idJeune },
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
  @Get('jeunes/:idJeune/animations-collectives')
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

  @Get('v2/jeunes/:idJeune/rendezvous')
  @ApiResponse({
    type: RendezVousJeuneQueryModelV2
  })
  async getRendezVousJeuneV2(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getRendezVousQueryParams?: GetRendezVousJeuneQueryParams
  ): Promise<RendezVousJeuneQueryModelV2> {
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
      return {
        resultat: result.data.queryModel,
        dateDerniereMiseAJour: result.data.dateDuCache?.toJSDate()
      }
    } else {
      const result = await this.getRendezVousJeuneQueryHandler.execute(
        {
          idJeune,
          periode: getRendezVousQueryParams?.periode
        },
        utilisateur
      )
      if (isSuccess(result)) {
        return {
          resultat: result.data
        }
      }
      throw handleFailure(result)
    }
  }
}
