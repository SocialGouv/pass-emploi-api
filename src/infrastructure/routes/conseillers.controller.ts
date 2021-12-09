import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateRendezVousCommandHandler } from 'src/application/commands/create-rendez-vous.command.handler'
import { GetDetailConseillerQueryHandler } from 'src/application/queries/get-detail-conseiller.query.handler'
import { GetJeunesByConseillerQueryHandler } from 'src/application/queries/get-jeunes-by-conseiller.query.handler'
import { DetailConseillerQueryModel } from 'src/application/queries/query-models/conseillers.query-models'
import { CreateActionCommandHandler } from '../../application/commands/create-action.command.handler'
import { CreateJeuneCommandHandler } from '../../application/commands/create-jeune.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from '../../application/commands/send-notification-nouveau-message.command.handler'
import { GetAllRendezVousConseillerQueryHandler } from '../../application/queries/get-rendez-vous-conseiller.query.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandler } from '../../application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import {
  DetailJeuneQueryModel,
  ResumeActionsDuJeuneQueryModel
} from '../../application/queries/query-models/jeunes.query-models'
import { RendezVousConseillerQueryModel } from '../../application/queries/query-models/rendez-vous.query-models'
import {
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../building-blocks/types/domain-error'
import {
  isFailure,
  isSuccess,
  Result
} from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import {
  CreateActionPayload,
  CreateJeunePayload
} from './validation/conseillers.inputs'
import { CreateRendezVousPayload } from './validation/rendez-vous.inputs'

@Controller('conseillers/:idConseiller')
@ApiTags('Conseillers')
export class ConseillersController {
  constructor(
    private readonly getDetailConseillerQueryHandler: GetDetailConseillerQueryHandler,
    private readonly getJeunesByConseillerQueryHandler: GetJeunesByConseillerQueryHandler,
    private readonly getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly createJeuneCommandHandler: CreateJeuneCommandHandler,
    private readonly sendNotificationNouveauMessage: SendNotificationNouveauMessageCommandHandler,
    private readonly getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler,
    private createRendezVousCommandHandler: CreateRendezVousCommandHandler
  ) {}

  @Get('')
  @ApiResponse({
    type: DetailConseillerQueryModel
  })
  async getDetailConseiller(
    @Param('idConseiller') idConseiller: string
  ): Promise<DetailConseillerQueryModel> {
    const queryModel = await this.getDetailConseillerQueryHandler.execute({
      idConseiller
    })
    if (queryModel) {
      return queryModel
    }

    throw new HttpException(
      `Conseiller ${idConseiller} not found`,
      HttpStatus.NOT_FOUND
    )
  }

  @Get('jeunes')
  @ApiResponse({
    type: DetailJeuneQueryModel,
    isArray: true
  })
  async getJeunes(
    @Param('idConseiller') idConseiller: string
  ): Promise<DetailJeuneQueryModel[]> {
    return this.getJeunesByConseillerQueryHandler.execute({ idConseiller })
  }

  @Post('jeune')
  @ApiResponse({
    type: DetailJeuneQueryModel,
    isArray: true
  })
  async createJeune(
    @Param('idConseiller') idConseiller: string,
    @Body() createJeunePayload: CreateJeunePayload
  ): Promise<DetailJeuneQueryModel> {
    const jeune = await this.createJeuneCommandHandler.execute({
      idConseiller,
      ...createJeunePayload
    })
    return {
      id: jeune.id,
      firstName: jeune.firstName,
      lastName: jeune.lastName,
      creationDate: jeune.creationDate.toString()
    }
  }

  @Post('jeunes/:idJeune/action')
  async createAction(
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string,
    @Body() createActionPayload: CreateActionPayload
  ): Promise<{ id: Action.Id }> {
    const result = await this.createActionCommandHandler.execute({
      contenu: createActionPayload.content,
      idJeune,
      idCreateur: idConseiller,
      typeCreateur: Action.TypeCreateur.CONSEILLER,
      commentaire: createActionPayload.comment
    })

    if (isFailure(result) && result.error.code === NonTrouveError.CODE) {
      throw new NotFoundException(result.error)
    }

    if (isSuccess(result)) {
      return {
        id: result.data
      }
    }
    throw new RuntimeException()
  }

  @Get('actions')
  async getActions(
    @Param('idConseiller') idConseiller: string
  ): Promise<ResumeActionsDuJeuneQueryModel[]> {
    return this.getResumeActionsDesJeunesDuConseillerQueryHandler.execute({
      idConseiller
    })
  }

  @Get('rendezvous')
  @ApiResponse({
    type: RendezVousConseillerQueryModel
  })
  async getRendezVous(
    @Param('idConseiller') idConseiller: string
  ): Promise<RendezVousConseillerQueryModel> {
    return this.getAllRendezVousConseillerQueryHandler.execute({ idConseiller })
  }

  @Post('jeunes/:idJeune/notify-message')
  async postNotification(
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string
  ): Promise<void> {
    const result = await this.sendNotificationNouveauMessage.execute({
      idConseiller,
      idJeune
    })
    if (isFailure(result)) {
      if (
        result.error.code === NonTrouveError.CODE ||
        result.error.code === JeuneNonLieAuConseillerError.CODE
      ) {
        throw new NotFoundException(result.error)
      } else {
        throw new RuntimeException()
      }
    }
  }

  @Post('rendezvous')
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

    if (isSuccess(result)) {
      return { id: result.data }
    }
    throw new RuntimeException()
  }
}
