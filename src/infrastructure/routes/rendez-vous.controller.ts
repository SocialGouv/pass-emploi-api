import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put
} from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../application/commands/delete-rendez-vous.command.handler.db'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from '../../application/commands/update-rendez-vous.command.handler'
import { GetDetailRendezVousQueryHandler } from '../../application/queries/get-detail-rendez-vous.query.handler.db'
import {
  RendezVousConseillerDetailQueryModel,
  RendezVousConseillerQueryModel
} from '../../application/queries/query-models/rendez-vous.query-model'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { UpdateRendezVousPayload } from './validation/rendez-vous.inputs'
import { handleFailure } from './failure.handler'

@Controller('rendezvous')
@ApiOAuth2([])
@ApiTags('Rendez-Vous')
export class RendezVousController {
  constructor(
    private readonly getDetailRendezVousQueryHandler: GetDetailRendezVousQueryHandler,
    private readonly deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler,
    private readonly updateRendezVousCommandHandler: UpdateRendezVousCommandHandler
  ) {}

  @Get(':idRendezVous')
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

  @Delete(':idRendezVous')
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

  @Put(':idRendezVous')
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
      presenceConseiller: updateRendezVousPayload.presenceConseiller
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
}
