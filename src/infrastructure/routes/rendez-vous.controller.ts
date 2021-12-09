import { Controller, Delete, NotFoundException, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { DeleteRendezVousCommandHandler } from '../../application/commands/delete-rendez-vous.command.handler'
import { isFailure } from '../../building-blocks/types/result'

@Controller()
@ApiTags('Rendez-Vous')
export class RendezVousController {
  constructor(
    private deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
  ) {}

  @Delete('rendezvous/:idRendezVous')
  async deleteRendezVous(
    @Param('idRendezVous') idRendezVous: string
  ): Promise<void> {
    const result = await this.deleteRendezVousCommandHandler.execute({
      idRendezVous
    })
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }
}
