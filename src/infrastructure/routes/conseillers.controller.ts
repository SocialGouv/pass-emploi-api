import {
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
import { ApiTags } from '@nestjs/swagger'
import { CreateActionCommandHandler } from '../../application/commands/create-action.command.handler'
import { CreateJeuneCommandHandler } from '../../application/commands/create-jeune.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from '../../application/commands/send-notification-nouveau-message.command.handler'
import {
  GetConseillerEtSesJeunesQuery,
  GetConseillerEtSesJeunesQueryHandler
} from '../../application/queries/get-conseiller-et-ses-jeunes.query.handler'
import { GetAllRendezVousConseillerQueryHandler } from '../../application/queries/get-rendez-vous-conseiller.query.handler'
import { GetResumeActionsDesJeunesDuConseillerQueryHandler } from '../../application/queries/get-resume-actions-des-jeunes-du-conseiller.query.handler'
import { DetailJeuneQueryModel } from '../../application/queries/query-models/jeunes.query-models'
import { RendezVousQueryModel } from '../../application/queries/query-models/rendez-vous.query-model'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import { ConseillerEtSesJeunesQueryModel } from '../../domain/conseiller'
import { ResumeActionsDuJeuneQueryModel } from '../../domain/jeune'
import {
  CreateActionPayload,
  CreateJeunePayload
} from './validation/conseillers.inputs'

@Controller('conseillers/:idConseiller')
@ApiTags('Conseillers')
export class ConseillersController {
  constructor(
    private readonly getConseillerEtSesJeunesQueryHandler: GetConseillerEtSesJeunesQueryHandler,
    private readonly getResumeActionsDesJeunesDuConseillerQueryHandler: GetResumeActionsDesJeunesDuConseillerQueryHandler,
    private readonly createActionCommandHandler: CreateActionCommandHandler,
    private readonly createJeuneCommandHandler: CreateJeuneCommandHandler,
    private readonly sendNotificationNouveauMessage: SendNotificationNouveauMessageCommandHandler,
    private readonly getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler
  ) {}

  @Get('login')
  async getConseillerEtSesJeunes(
    @Param('idConseiller') idConseiller: string
  ): Promise<ConseillerEtSesJeunesQueryModel> {
    const query: GetConseillerEtSesJeunesQuery = { idConseiller }
    const queryModel = await this.getConseillerEtSesJeunesQueryHandler.execute(
      query
    )
    if (queryModel) {
      return queryModel
    }

    throw new HttpException(
      `Conseiller ${idConseiller} not found`,
      HttpStatus.NOT_FOUND
    )
  }

  @Post('jeune')
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
      lastName: jeune.lastName
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
  async getJeunesSumup(
    @Param('idConseiller') idConseiller: string
  ): Promise<ResumeActionsDuJeuneQueryModel[]> {
    return this.getResumeActionsDesJeunesDuConseillerQueryHandler.execute({
      idConseiller
    })
  }

  @Get('rendezvous')
  async getRendezVous(
    @Param('idConseiller') idConseiller: string
  ): Promise<RendezVousQueryModel[]> {
    return this.getAllRendezVousConseillerQueryHandler.execute({ idConseiller })
  }

  @Post('jeunes/:idJeune/notify-message')
  async postNotification(
    @Param('idConseiller') idConseiller: string,
    @Param('idJeune') idJeune: string
  ): Promise<void> {
    this.sendNotificationNouveauMessage.execute({ idConseiller, idJeune })
  }
}
