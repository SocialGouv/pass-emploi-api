import { Body, Controller, Post } from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  CreateEvenementCommand,
  CreateEvenementCommandHandler
} from '../../application/commands/create-evenement.command.handler'
import { CreateEvenementPayload } from './validation/evenements.inputs'

@Controller('evenements')
@ApiOAuth2([])
@ApiTags('Evenements')
export class EvenementsController {
  constructor(
    private readonly createEvenementCommandHandler: CreateEvenementCommandHandler
  ) {}

  @Post()
  creerEvenement(
    @Body() createEvenementPayload: CreateEvenementPayload
  ): Promise<void> {
    const command: CreateEvenementCommand = {
      type: createEvenementPayload.type,
      emetteur: createEvenementPayload.emetteur
    }
    return this.createEvenementCommandHandler.execute(command)
  }
}
