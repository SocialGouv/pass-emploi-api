import {
  Controller,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe
} from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  DeleteRendezVousCommand,
  DeleteRendezVousCommandHandler
} from '../../application/commands/delete-rendez-vous.command.handler'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'

@Controller()
@ApiOAuth2([])
@ApiTags('Rendez-Vous')
export class RendezVousController {
  constructor(
    private deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
  ) {}

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
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }
}
