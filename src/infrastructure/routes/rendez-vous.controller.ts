import { Controller, Delete, NotFoundException, Param } from '@nestjs/common'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import { DeleteRendezVousCommandHandler } from '../../application/commands/delete-rendez-vous.command.handler'
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
  async deleteRendezVous(
    @Param('idRendezVous') idRendezVous: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteRendezVousCommandHandler.execute(
      {
        idRendezVous
      },
      utilisateur
    )
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }
}
