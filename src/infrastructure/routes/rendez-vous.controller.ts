import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  UpdateRendezVousCommand,
  UpdateRendezVousCommandHandler
} from 'src/application/commands/update-rendez-vous.command.handler'
import { GetDetailRendezVousQueryHandler } from 'src/application/queries/get-detail-rendez-vous.query.handler'
import { RendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-models'
import {
  MauvaiseCommandeError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { Core } from 'src/domain/core'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../application/commands/delete-rendez-vous.command.handler'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { UpdateRendezVousPayload } from './validation/rendez-vous.inputs'

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
    type: RendezVousQueryModel
  })
  async getDetailRendezVous(
    @Param('idRendezVous', new ParseUUIDPipe()) idRendezVous: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<RendezVousQueryModel> {
    const result = await this.getDetailRendezVousQueryHandler.execute(
      { idRendezVous },
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    if (isFailure(result)) {
      if (result.error instanceof NonTrouveError) {
        throw new NotFoundException(result.error)
      }
    }

    throw new RuntimeException()
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
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }

  @Put(':idRendezVous')
  async updateRendezVous(
    @Param('idRendezVous') idRendezVous: string,
    @Body() updateRendezVousPayload: UpdateRendezVousPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
    const command: UpdateRendezVousCommand = {
      idRendezVous: idRendezVous,
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

    if (isFailure(result)) {
      switch (result.error.code) {
        case NonTrouveError.CODE:
          throw new NotFoundException(result.error)
        case MauvaiseCommandeError.CODE:
          throw new BadRequestException(result.error)
      }
    }
    if (isSuccess(result)) {
      return result.data
    }
    throw new RuntimeException()
  }
}
