import {
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetDetailRendezVousQueryHandler } from 'src/application/queries/get-detail-rendez-vous.query.handler'
import { RendezVousQueryModel } from 'src/application/queries/query-models/rendez-vous.query-models'
import { NonTrouveError } from 'src/building-blocks/types/domain-error'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../application/commands/delete-rendez-vous.command.handler'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'

@Controller('rendezvous')
@ApiOAuth2([])
@ApiTags('Rendez-Vous')
export class RendezVousController {
  constructor(
    private readonly getDetailRendezVousQueryHandler: GetDetailRendezVousQueryHandler,
    private readonly deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
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
}
