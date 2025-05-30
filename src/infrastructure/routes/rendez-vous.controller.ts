import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import { handleResult } from 'src/infrastructure/routes/result.handler'
import {
  CloreRendezVousCommand,
  CloreRendezVousCommandHandler
} from '../../application/commands/clore-rendez-vous.command.handler'
import {
  CreateRendezVousCommand,
  CreateRendezVousCommandHandler
} from '../../application/commands/create-rendez-vous.command.handler'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../application/commands/delete-rendez-vous.command.handler.db'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from '../../application/commands/update-rendez-vous.command.handler'
import {
  GetRendezVousACloreQueryModel,
  RendezVousConseillerDetailQueryModel,
  RendezVousConseillerQueryModel,
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModel,
  RendezVousJeuneQueryModelV2
} from '../../application/queries/query-models/rendez-vous.query-model'
import {
  GetAnimationsCollectivesJeuneQuery,
  GetAnimationsCollectivesJeuneQueryHandler
} from '../../application/queries/rendez-vous/get-animations-collectives-jeune.query.handler.db'
import { GetDetailRendezVousJeuneQueryHandler } from '../../application/queries/rendez-vous/get-detail-rendez-vous-jeune.query.handler.db'
import { GetDetailRendezVousQueryHandler } from '../../application/queries/rendez-vous/get-detail-rendez-vous.query.handler.db'
import {
  GetRendezVousACloreQuery,
  GetRendezVousACloreQueryHandler
} from '../../application/queries/rendez-vous/get-rendez-vous-a-clore.query.handler.db'
import {
  GetRendezVousConseillerPaginesQuery,
  GetRendezVousConseillerPaginesQueryHandler
} from '../../application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { AccessToken, Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { GetRendezVousConseillerV2QueryParams } from './validation/conseillers.inputs'
import {
  GetRendezVousJeuneQueryParams,
  MaintenantQueryParams
} from './validation/jeunes.inputs'
import {
  CloreRendezVousPayload,
  CreateRendezVousPayload,
  GetRendezVousACloreQueryParams,
  UpdateRendezVousPayload
} from './validation/rendez-vous.inputs'

@Controller()
@CustomSwaggerApiOAuth2()
@ApiTags(
  'Rendez-vous du CEJ pour Milo / Pass Emploi (uniquement GET liste pour PE)'
)
export class RendezVousController {
  constructor(
    private readonly getDetailRendezVousQueryHandler: GetDetailRendezVousQueryHandler,
    private readonly deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler,
    private readonly updateRendezVousCommandHandler: UpdateRendezVousCommandHandler,
    private readonly createRendezVousCommandHandler: CreateRendezVousCommandHandler,
    private readonly cloreRendezVousCommandHandler: CloreRendezVousCommandHandler,
    private readonly getRendezVousACloreQueryHandler: GetRendezVousACloreQueryHandler,
    private readonly getRendezVousConseillerPaginesQueryHandler: GetRendezVousConseillerPaginesQueryHandler,
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Clos rdv individuel',
    description: 'Autorisé pour le conseiller du rdv'
  })
  @Post('rendezvous/:idRendezVous/clore')
  async cloreRendezVous(
    @Param('idRendezVous', new ParseUUIDPipe()) idRendezVous: string,
    @Body() cloreRendezVousPayload: CloreRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CloreRendezVousCommand = {
      idRendezVous,
      idsJeunesPresents: cloreRendezVousPayload.idsJeunesPresents
    }

    const result = await this.cloreRendezVousCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Récupère les rdv et AC à clore',
    description: 'Autorisé pour un conseiller Milo'
  })
  @Get('conseillers/:idConseiller/rendezvous/a-clore')
  async getRendezVousAClore(
    @Param('idConseiller') idConseiller: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @Query() qp: GetRendezVousACloreQueryParams
  ): Promise<GetRendezVousACloreQueryModel> {
    const query: GetRendezVousACloreQuery = {
      idConseiller,
      page: qp.page,
      limit: qp.limit
    }

    const result = await this.getRendezVousACloreQueryHandler.execute(
      query,
      utilisateur
    )

    return handleResult(result)
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

    return handleResult(result, id => ({ id }))
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

    return handleResult(result)
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

    return handleResult(result)
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

    return handleResult(result)
  }

  @Get('jeunes/:idJeune/rendezvous')
  @ApiOperation({
    summary: 'Récupère les rendez-vous d’un jeune FT Connect, sans cache',
    description: 'Autorisé pour un jeune FT Connect'
  })
  @ApiResponse({
    type: RendezVousJeuneQueryModel,
    isArray: true
  })
  async getRendezVousJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getRendezVousQueryParams?: GetRendezVousJeuneQueryParams
  ): Promise<RendezVousJeuneQueryModel[]> {
    const result = await this.getRendezVousJeunePoleEmploiQueryHandler.execute(
      {
        idJeune,
        accessToken,
        periode: getRendezVousQueryParams?.periode
      },
      utilisateur
    )

    return handleResult(result, ({ queryModel, dateDuCache }) => {
      if (dateDuCache)
        throw new InternalServerErrorException(
          'Les données de Pôle emploi sont inaccessibles'
        )
      return queryModel
    })
  }

  @Get('v2/jeunes/:idJeune/rendezvous')
  @ApiOperation({
    summary: 'Récupère les rendez-vous d’un jeune FT Connect, avec cache',
    description: 'Autorisé pour un jeune FT Connect'
  })
  @ApiResponse({
    type: RendezVousJeuneQueryModelV2
  })
  async getRendezVousJeuneV2(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur,
    @AccessToken() accessToken: string,
    @Query() getRendezVousQueryParams?: GetRendezVousJeuneQueryParams
  ): Promise<RendezVousJeuneQueryModelV2> {
    const result = await this.getRendezVousJeunePoleEmploiQueryHandler.execute(
      {
        idJeune,
        accessToken,
        periode: getRendezVousQueryParams?.periode
      },
      utilisateur
    )

    return handleResult(result, ({ queryModel, dateDuCache }) => ({
      resultat: queryModel,
      dateDerniereMiseAJour: dateDuCache?.toJSDate()
    }))
  }
}
