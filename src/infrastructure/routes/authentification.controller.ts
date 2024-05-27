import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  SetMetadata,
  UseGuards
} from '@nestjs/common'
import {
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
import { GetUtilisateurQueryHandler } from '../../application/queries/get-utilisateur.query.handler'
import {
  ChatSecretsQueryModel,
  UtilisateurQueryModel
} from '../../application/queries/query-models/authentification.query-model'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import {
  GetUtilisateurQueryParams,
  PutUtilisateurPayload
} from './validation/authentification.inputs'

@Controller('auth')
@ApiTags('Authentification')
export class AuthentificationController {
  constructor(
    private updateUtilisateurCommandHandler: UpdateUtilisateurCommandHandler,
    private getUtilisateurQueryHandler: GetUtilisateurQueryHandler,
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
      "Récupère un utilisateur jeune/conseiller, crée le conseiller PE/Milo si il n'existe pas"
  })
  @Put('users/:idAuthentification')
  @ApiResponse({
    type: UtilisateurQueryModel
  })
  async putUtilisateur(
    @Param('idAuthentification') idAuthentification: string,
    @Body() updateUserPayload: PutUtilisateurPayload
  ): Promise<UtilisateurQueryModel> {
    const command: UpdateUtilisateurCommand = {
      ...updateUserPayload,
      idUtilisateurAuth: idAuthentification
    }
    const result = await this.updateUtilisateurCommandHandler.execute(command)

    return handleResult(result)
  }

  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.KEYCLOAK
  )
  @ApiOperation({
    summary: 'Récupère un utilisateur jeune/conseiller'
  })
  @Get('users/:idAuthentification')
  @ApiResponse({
    type: UtilisateurQueryModel
  })
  async getUtilisateur(
    @Param('idAuthentification') idAuthentification: string,
    @Query() queryParams: GetUtilisateurQueryParams
  ): Promise<UtilisateurQueryModel> {
    const result = await this.getUtilisateurQueryHandler.execute({
      idAuthentification: idAuthentification,
      typeUtilisateur: queryParams.typeUtilisateur,
      structureUtilisateur: queryParams.structureUtilisateur
    })

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Récupère le token et la clé de chiffrement du chat du jeune'
  })
  @Post('firebase/token')
  @CustomSwaggerApiOAuth2()
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
