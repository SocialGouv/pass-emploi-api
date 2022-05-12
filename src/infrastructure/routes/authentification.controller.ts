import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  SetMetadata,
  UnprocessableEntityException,
  UseGuards
} from '@nestjs/common'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import {
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags
} from '@nestjs/swagger'
import { GetChatSecretsQueryHandler } from 'src/application/queries/get-chat-secrets.query.handler'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../application/commands/update-utilisateur.command.handler'
import {
  ChatSecretsQueryModel,
  UtilisateurQueryModel
} from '../../application/queries/query-models/authentification.query-models'
import {
  NonTrouveError,
  ConseillerNonValide,
  NonTraitableError
} from '../../building-blocks/types/domain-error'
import { isFailure, isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { UpdateUserPayload } from './validation/authentification.inputs'

@Controller()
@ApiTags('Authentification')
export class AuthentificationController {
  constructor(
    private updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler,
    private getChatSecretsQueryHandler: GetChatSecretsQueryHandler
  ) {}

  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.KEYCLOAK
  )
  @ApiOperation({
    summary:
      "Récupère un jeune/conseiller, crée le conseiller PE/Milo si il n'existe pas"
  })
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
      if (result.error.code === NonTraitableError.CODE) {
        throw new UnprocessableEntityException(result.error)
      }
      if (result.error.code === ConseillerNonValide.CODE) {
        throw new BadRequestException(result.error)
      }
    }

    throw new RuntimeException()
  }

  @ApiOperation({
    summary: 'Récupère le token et la clé de chiffrement du chat du jeune'
  })
  @Post('auth/firebase/token')
  @ApiOAuth2([])
  async postFirebaseToken(
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ChatSecretsQueryModel> {
    const queryModel = await this.getChatSecretsQueryHandler.execute({
      utilisateur
    })

    if (queryModel) {
      return queryModel
    }

    throw new HttpException(
      `Could not find chat secrets`,
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  }
}
