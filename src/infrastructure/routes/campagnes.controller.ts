import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import { CreateCampagnePayload } from './validation/campagnes.inputs'
import {
  CreateCampagneCommand,
  CreateCampagneCommandHandler
} from '../../application/commands/create-campagne.command'
import { DateTime } from 'luxon'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { CampagneExisteDejaError } from '../../building-blocks/types/domain-error'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'

@Controller('campagnes')
@ApiOAuth2([])
@ApiTags('Campagnes')
export class CampagnesController {
  constructor(
    private createCampagneCommandHandler: CreateCampagneCommandHandler
  ) {}

  @Post()
  async creerCampagne(
    @Body() createCampagnePayload: CreateCampagnePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<string> {
    const command: CreateCampagneCommand = {
      nom: createCampagnePayload.nom,
      dateDebut: DateTime.fromISO(createCampagnePayload.dateDebut).toUTC(),
      dateFin: DateTime.fromISO(createCampagnePayload.dateFin).toUTC()
    }
    const result = await this.createCampagneCommandHandler.execute(
      command,
      utilisateur
    )

    if (
      isFailure(result) &&
      result.error.code === CampagneExisteDejaError.CODE
    ) {
      throw new BadRequestException(result.error)
    }

    if (isSuccess(result)) {
      return result.data
    }

    throw new RuntimeException()
  }
}
