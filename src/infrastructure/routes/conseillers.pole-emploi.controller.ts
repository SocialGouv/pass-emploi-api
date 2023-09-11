import { Body, Controller, Param, Post } from '@nestjs/common'
import { ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import { isFailure } from 'src/building-blocks/types/result'
import {
  SendNotificationsNouveauxMessagesExterneCommand,
  SendNotificationsNouveauxMessagesExterneCommandHandler
} from '../../application/commands/send-notifications-nouveaux-messages-externe.command.handler'
import { handleFailure } from './failure.handler'
import { EnvoyerNotificationsExternePayload } from './validation/conseiller-pole-emploi.inputs'

@Controller('conseillers/pole-emploi')
@ApiOAuth2([])
@ApiTags('Conseillers Pôle emploi')
export class ConseillersPoleEmploiController {
  constructor(
    private readonly sendNotificationsNouveauxMessagesExterne: SendNotificationsNouveauxMessagesExterneCommandHandler
  ) {}

  @ApiOperation({
    summary: "Envoie une notification d'un nouveau message à des jeunes",
    description: 'Autorisé pour un conseiller'
  })
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
