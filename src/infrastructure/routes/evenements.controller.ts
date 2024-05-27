import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import {
  CreateEvenementCommand,
  CreateEvenementCommandHandler
} from '../../application/commands/create-evenement.command.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { CreateEvenementPayload } from './validation/evenements.inputs'

@Controller('evenements')
@CustomSwaggerApiOAuth2()
@ApiTags("Evenements d'engagement")
export class EvenementsController {
  constructor(
    private readonly createEvenementCommandHandler: CreateEvenementCommandHandler
  ) {}

  @Post()
  async creerEvenement(
    @Body() createEvenementPayload: CreateEvenementPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: CreateEvenementCommand = {
      type: createEvenementPayload.type,
      emetteur: createEvenementPayload.emetteur
    }
    await this.createEvenementCommandHandler.execute(command, utilisateur)
  }
}
