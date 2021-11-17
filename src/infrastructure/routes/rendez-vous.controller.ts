import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common'
import assert from 'assert'
import { CreateRendezVousCommandHandler } from '../../application/commands/create-rendez-vous.command.handler'
import { DeleteRendezVousCommandHandler } from '../../application/commands/delete-rendez-vous.command.handler'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  isFailure,
  isSuccess,
  Result
} from '../../building-blocks/types/result'
import { CreateRendezVousPayload } from './validation/rendez-vous.inputs'

@Controller()
export class RendezVousController {
  constructor(
    private createRendezVousCommandHandler: CreateRendezVousCommandHandler,
    private deleteRendezVousCommandHandler: DeleteRendezVousCommandHandler
  ) {}

  @Post('conseillers/:idConseiller/rendezvous')
  async createRendezVous(
    @Param('idConseiller') idConseiller: string,
    @Body() createRendezVousPayload: CreateRendezVousPayload
  ): Promise<{ id: string }> {
    const result: Result<string> =
      await this.createRendezVousCommandHandler.execute({
        idJeune: createRendezVousPayload.jeuneId,
        commentaire: createRendezVousPayload.comment,
        date: createRendezVousPayload.date,
        duree: createRendezVousPayload.duration,
        idConseiller: idConseiller,
        modalite: createRendezVousPayload.modality
      })

    if (isFailure(result)) {
      switch (result.error.code) {
        case JeuneNonLieAuConseillerError.CODE:
          throw new BadRequestException(result.error)
        case NonTrouveError.CODE:
          throw new NotFoundException(result.error)
      }
    }

    assert(isSuccess(result))
    return { id: result.data }
  }

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
