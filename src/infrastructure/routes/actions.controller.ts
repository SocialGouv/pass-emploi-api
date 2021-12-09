import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put
} from '@nestjs/common'
import { ApiOAuth2, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Authentification } from 'src/domain/authentification'
import { DeleteActionCommandHandler } from '../../application/commands/delete-action.command.handler'
import {
  UpdateStatutActionCommand,
  UpdateStatutActionCommandHandler
} from '../../application/commands/update-statut-action.command.handler'
import {
  GetDetailActionQuery,
  GetDetailActionQueryHandler
} from '../../application/queries/get-detail-action.query.handler'
import { ActionQueryModel } from '../../application/queries/query-models/actions.query-model'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { isFailure } from '../../building-blocks/types/result'
import { Action } from '../../domain/action'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { UpdateStatutActionPayload } from './validation/actions.inputs'

@Controller('actions')
@ApiOAuth2([])
@ApiTags('Actions')
export class ActionsController {
  constructor(
    private readonly getDetailActionQueryHandler: GetDetailActionQueryHandler,
    private readonly updateStatutActionCommandHandler: UpdateStatutActionCommandHandler,
    private readonly deleteActionCommandHandler: DeleteActionCommandHandler
  ) {}

  @Get(':idAction')
  @ApiResponse({
    type: ActionQueryModel
  })
  async getDetailAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ActionQueryModel> {
    const query: GetDetailActionQuery = { idAction }
    const queryModel = await this.getDetailActionQueryHandler.execute(
      query,
      utilisateur
    )
    if (queryModel) {
      return queryModel
    }

    throw new HttpException(
      `Action ${idAction} not found`,
      HttpStatus.NOT_FOUND
    )
  }

  @Put(':idAction')
  async updateStatutAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Body() updateStatutActionPayload: UpdateStatutActionPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: UpdateStatutActionCommand = {
      idAction,
      statut: updateStatutActionPayload.status
        ? (updateStatutActionPayload.status as Action.Statut)
        : undefined,
      estTerminee: updateStatutActionPayload.isDone
    }
    const result = await this.updateStatutActionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new HttpException(
          `Action ${idAction} not found`,
          HttpStatus.NOT_FOUND
        )
      }
      throw new HttpException(result.error.message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete(':idAction')
  @HttpCode(204)
  async deleteAction(
    @Param('idAction', new ParseUUIDPipe()) idAction: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteActionCommandHandler.execute(
      {
        idAction
      },
      utilisateur
    )
    if (isFailure(result)) {
      throw new NotFoundException(result.error)
    }
  }
}
