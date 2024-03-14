import {
  Body,
  Controller,
  HttpStatus,
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
import { handleResult } from 'src/infrastructure/routes/result.handler'
import { CreerJeunePoleEmploiCommandHandler } from '../../application/commands/pole-emploi/creer-jeune-pole-emploi.command.handler'
import {
  SendNotificationsNouveauxMessagesExternesCommand,
  SendNotificationsNouveauxMessagesExternesCommandHandler,
  SendNotificationsNouveauxMessagesExternesResult
} from '../../application/commands/send-notifications-nouveaux-messages-externes.command.handler'
import { JeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { EnvoyerNotificationsExternePayload } from './validation/conseiller-pole-emploi.inputs'
import { CreateJeunePoleEmploiPayload } from './validation/conseillers.inputs'

@Controller('conseillers/pole-emploi')
@ApiOAuth2([])
@ApiTags('Conseillers Pôle emploi')
export class ConseillersPoleEmploiController {
  constructor(
    private readonly creerJeunePoleEmploiCommandHandler: CreerJeunePoleEmploiCommandHandler,
    private readonly sendNotificationsNouveauxMessagesExternes: SendNotificationsNouveauxMessagesExternesCommandHandler
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

    return handleResult(result, jeune => ({
      id: jeune.id,
      firstName: jeune.firstName,
      lastName: jeune.lastName,
      idConseiller: jeune.conseiller!.id
    }))
  }

  @ApiOperation({
    summary: "Envoie une notification d'un nouveau message à des bénéficiaires",
    description: 'Autorisé via API KEY (pour France Travail)'
  })
  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
  @SetMetadata(
    Authentification.METADATA_IDENTIFIER_API_KEY_PARTENAIRE,
    Authentification.Partenaire.POLE_EMPLOI
  )
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Les notifications sont envoyées aux bénéficiaires'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Si au moins l’un des bénéficiaires n’est pas trouvé dans la système du CEJ (aucune notification ne sera envoyée)'
  })
  @Post('beneficiaires/notifier-message')
  async postNotifications(
    @Body() envoyerNotificationsPayload: EnvoyerNotificationsExternePayload
  ): Promise<SendNotificationsNouveauxMessagesExternesResult> {
    const command: SendNotificationsNouveauxMessagesExternesCommand = {
      idsAuthentificationJeunes:
        envoyerNotificationsPayload.idsAuthentificationBeneficiaires
    }
    const result = await this.sendNotificationsNouveauxMessagesExternes.execute(
      command
    )

    return handleResult(result)
  }
}
