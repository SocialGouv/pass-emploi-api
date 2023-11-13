import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  SetMetadata,
  UseGuards
} from '@nestjs/common'
import {
  ApiOAuth2,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags
} from '@nestjs/swagger'
import {
  UpdateUtilisateurCommand,
  UpdateUtilisateurCommandHandler
} from '../../application/commands/update-utilisateur.command.handler'
import { GetChatSecretsQueryHandler } from '../../application/queries/get-chat-secrets.query.handler'
import {
  ChatSecretsQueryModel,
  UtilisateurQueryModel
} from '../../application/queries/query-models/authentification.query-model'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { handleResult } from './result.handler'
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

    return handleResult(result)
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
