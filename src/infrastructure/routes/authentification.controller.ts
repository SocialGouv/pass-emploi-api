import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { ApiOAuth2, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../application/commands/update-utilisateur.command.handler'
import {
  FirebaseTokenQueryModel,
  UtilisateurQueryModel
} from '../../application/queries/query-models/authentification.query-models'
import {
  NonTrouveError,
  UtilisateurMiloNonValide
} from '../../building-blocks/types/domain-error'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { FirebaseClient } from '../clients/firebase-client'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { UpdateUserPayload } from './validation/authentification.inputs'

@Controller()
@ApiTags('Authentification')
export class AuthentificationController {
  constructor(
    private updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler,
    private firebaseClient: FirebaseClient
  ) {}

  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
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

  @Post('auth/firebase/token')
  @ApiOAuth2([])
  async postFirebaseToken(
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<FirebaseTokenQueryModel> {
    const firebaseToken = await this.firebaseClient.getToken(utilisateur)
    return { token: firebaseToken }
  }
}
