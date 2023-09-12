import {
  Body,
  Controller,
  Param,
  Post,
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
import { isFailure, isSuccess } from 'src/building-blocks/types/result'
import { CreerJeunePoleEmploiCommandHandler } from '../../application/commands/creer-jeune-pole-emploi.command.handler'
import {
  SendNotificationsNouveauxMessagesExterneCommand,
  SendNotificationsNouveauxMessagesExterneCommandHandler
} from '../../application/commands/send-notifications-nouveaux-messages-externe.command.handler'
import { JeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { handleFailure } from './failure.handler'
import { EnvoyerNotificationsExternePayload } from './validation/conseiller-pole-emploi.inputs'
import { CreateJeunePoleEmploiPayload } from './validation/conseillers.inputs'

@Controller('conseillers/pole-emploi')
@ApiOAuth2([])
@ApiTags('Conseillers Pôle emploi')
export class ConseillersPoleEmploiController {
  constructor(
    private readonly creerJeunePoleEmploiCommandHandler: CreerJeunePoleEmploiCommandHandler,
    private readonly sendNotificationsNouveauxMessagesExterne: SendNotificationsNouveauxMessagesExterneCommandHandler
  ) {}

  @ApiOperation({
    summary: 'Crée un jeune PE',
    description: 'Autorisé pour un conseiller PE'
  })
  @Post('jeunes')
  @ApiResponse({
    type: JeuneQueryModel
  })
  async createJeunePoleEmploi(
    @Body() createJeunePayload: CreateJeunePoleEmploiPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<JeuneQueryModel> {
    const result = await this.creerJeunePoleEmploiCommandHandler.execute(
      {
        ...createJeunePayload
      },
      utilisateur
    )

    if (isSuccess(result)) {
      const jeune = result.data
      return {
        id: jeune.id,
        firstName: jeune.firstName,
        lastName: jeune.lastName,
        idConseiller: jeune.conseiller!.id
      }
    }

    throw handleFailure(result)
  }

  @ApiOperation({
    summary: "Envoie une notification d'un nouveau message à des jeunes",
    description: 'Autorisé pour un conseiller'
  })
  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.POLE_EMPLOI
  )
  @Post(':idAuthentificationConseiller/beneficiaires/notifier-message')
  async postNotifications(
    @Param('idAuthentificationConseiller') idAuthentificationConseiller: string,
    @Body() envoyerNotificationsPayload: EnvoyerNotificationsExternePayload
  ): Promise<void> {
    const command: SendNotificationsNouveauxMessagesExterneCommand = {
      idAuthentificationConseiller: idAuthentificationConseiller,
      idsAuthentificationJeunes:
        envoyerNotificationsPayload.idsAuthentificationBeneficiaires
    }
    const result = await this.sendNotificationsNouveauxMessagesExterne.execute(
      command
    )

    if (isFailure(result)) {
      handleFailure(result)
    }
  }
}
