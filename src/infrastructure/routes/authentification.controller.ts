import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Put
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../application/commands/update-utilisateur.command.handler'
import { UtilisateurQueryModel } from '../../application/queries/query-models/authentification.query-models'
import {
  NonTrouveError,
  UtilisateurMiloNonValide
} from '../../building-blocks/types/domain-error'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Public } from '../decorators/public.decorator'
import { UpdateUserPayload } from './validation/authentification.inputs'

@Public()
@Controller()
@ApiTags('Authentification')
export class AuthentificationController {
  constructor(
    private updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler
  ) {}

  @Put('auth/users/:idUtilisateurAuth')
  @ApiResponse({
    type: UtilisateurQueryModel
  })
  async putUtilisateur(
    @Param('idUtilisateurAuth') idUtilisateurAuth: string,
    @Body() updateUserPayload: UpdateUserPayload
  ): Promise<UtilisateurQueryModel> {
    const command: UpdateUtilisateurCommand = {
      ...updateUserPayload,
      idUtilisateurAuth: idUtilisateurAuth
    }
    const result = await this.updateUtilisateurCommandHandler.execute(command)

    if (isSuccess(result)) {
      return result.data
    }

    if (isFailure(result)) {
      if (result.error.code === NonTrouveError.CODE) {
        throw new NotFoundException(result.error)
      }
      if (result.error.code === UtilisateurMiloNonValide.CODE) {
        throw new BadRequestException(result.error)
      }
    }

    throw new RuntimeException()
  }
}
