import {
  Body,
  Controller,
  Param,
  ParseArrayPipe,
  ParseUUIDPipe,
  Post
} from '@nestjs/common'
import { ApiBody, ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ValidateNested } from 'class-validator'
import { DateTime } from 'luxon'
import {
  CreateCampagneCommand,
  CreateCampagneCommandHandler
} from '../../application/commands/campagne/create-campagne.command'
import {
  CreateEvaluationCommand,
  CreateEvaluationCommandHandler
} from '../../application/commands/campagne/create-evaluation.command'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleResult } from './result.handler'
import {
  CreateCampagnePayload,
  ReponseCampagnePayload
} from './validation/campagnes.inputs'

@Controller()
@ApiOAuth2([])
export class CampagnesController {
  constructor(
    private createCampagneCommandHandler: CreateCampagneCommandHandler,
    private createEvaluationCommandHandler: CreateEvaluationCommandHandler
  ) {}

  @ApiTags('Support')
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
      dateDebut: DateTime.fromISO(createCampagnePayload.dateDebut),
      dateFin: DateTime.fromISO(createCampagnePayload.dateFin)
    }
    const result = await this.createCampagneCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @ApiTags('Campagnes')
  @ApiOperation({
    summary: 'Poster une évaluation (réponses à une campagne active)',
    description: 'Autorisé pour un jeune'
  })
  @Post('jeunes/:idJeune/campagnes/:idCampagne/evaluer')
  @ValidateNested({ each: true })
  @ApiBody({
    type: ReponseCampagnePayload,
    isArray: true
  })
  async evaluer(
    @Body(new ParseArrayPipe({ items: ReponseCampagnePayload }))
    reponsesCampagnePayload: ReponseCampagnePayload[],
    @Param('idJeune') idJeune: string,
    @Param('idCampagne', new ParseUUIDPipe()) idCampagne: string,
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

    return handleResult(result)
  }
}
