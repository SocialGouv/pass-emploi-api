import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common'
import { ApiBody, ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import {
  CreateCampagnePayload,
  ReponseCampagnePayload
} from './validation/campagnes.inputs'
import {
  CreateCampagneCommand,
  CreateCampagneCommandHandler
} from '../../application/commands/create-campagne.command'
import { DateTime } from 'luxon'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import {
  CampagneExisteDejaError,
  CampagneNonActive,
  NonTrouveError,
  ReponsesCampagneInvalide
} from '../../building-blocks/types/domain-error'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { Core } from '../../domain/core'
import {
  CreateEvaluationCommand,
  CreateEvaluationCommandHandler
} from '../../application/commands/create-evaluation.command'

@Controller()
@ApiOAuth2([])
@ApiTags('Campagnes')
export class CampagnesController {
  constructor(
    private createCampagneCommandHandler: CreateCampagneCommandHandler,
    private createEvaluationCommandHandler: CreateEvaluationCommandHandler
  ) {}

  @ApiOperation({
    summary: "Création d'une nouvelle campagne",
    description: 'Autorisé pour le support'
  })
  @Post('campagnes')
  async creerCampagne(
    @Body() createCampagnePayload: CreateCampagnePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<Core.Id> {
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

  @ApiOperation({
    summary: 'Poster une évaluation',
    description: 'Autorisé pour un jeune'
  })
  @Post('jeunes/:idJeune/campagnes/:idCampagne/evaluer')
  @ApiBody({
    type: ReponseCampagnePayload,
    isArray: true
  })
  async evaluer(
    @Body() reponsesCampagnePayload: ReponseCampagnePayload[],
    @Param('idJeune') idJeune: string,
    @Param('idCampagne') idCampagne: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateEvaluationCommand = {
      idJeune,
      idCampagne,
      reponses: reponsesCampagnePayload
    }
    const result = await this.createEvaluationCommandHandler.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      switch (result.error.code) {
        case ReponsesCampagneInvalide.CODE:
        case CampagneNonActive.CODE:
          throw new BadRequestException(result.error)

        case NonTrouveError.CODE:
          throw new NotFoundException(result.error)

        default:
          throw new RuntimeException()
      }
    }

    if (isSuccess(result)) {
      return result.data
    }

    throw new RuntimeException()
  }
}
