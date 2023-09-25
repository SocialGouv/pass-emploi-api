import {
  Body,
  Controller,
  HttpStatus,
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
import { isSuccess } from 'src/building-blocks/types/result'
import { CreerJeunePoleEmploiCommandHandler } from '../../application/commands/creer-jeune-pole-emploi.command.handler'
import {
  SendNotificationsNouveauxMessagesExternesCommand,
  SendNotificationsNouveauxMessagesExternesCommandHandler
} from '../../application/commands/send-notifications-nouveaux-messages-externes.command.handler'
import { JeuneQueryModel } from '../../application/queries/query-models/jeunes.query-model'
import { Authentification } from '../../domain/authentification'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { handleFailure } from './result.handler'
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
    summary:
      "Envoie une notification d'un nouveau message à des bénéficiaires du conseiller",
    description: 'Autorisé pour un conseiller'
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
    description:
      'Les notifications sont envoyées aux bénéficiaires du conseiller'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Si au moins l’un des bénéficiaires n’est pas trouvé dans la système du CEJ (aucune notification ne sera envoyée)'
  })
  @Post(':idAuthentificationConseiller/beneficiaires/notifier-message')
  async postNotifications(
    @Param('idAuthentificationConseiller') idAuthentificationConseiller: string,
    @Body() envoyerNotificationsPayload: EnvoyerNotificationsExternePayload
  ): Promise<void> {
    const command: SendNotificationsNouveauxMessagesExternesCommand = {
      idAuthentificationConseiller: idAuthentificationConseiller,
      idsAuthentificationJeunes:
        envoyerNotificationsPayload.idsAuthentificationBeneficiaires
    }
    const result = await this.sendNotificationsNouveauxMessagesExternes.execute(
      command
    )

    handleFailure(result)
  }
}
