import { Body, Controller, NotFoundException, Param, Put } from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../application/commands/update-utilisateur.command.handler'
import { UtilisateurQueryModel } from '../../application/queries/query-models/authentification.query-models'
import { NonTrouveError } from '../../building-blocks/types/domain-error'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { UpdateUserPayload } from './validation/authentification.inputs'

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

    if (isFailure(result) && result.error.code === NonTrouveError.CODE) {
      throw new NotFoundException(result.error)
    }

    throw new RuntimeException()
  }
}
