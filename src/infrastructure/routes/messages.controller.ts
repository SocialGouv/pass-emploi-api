import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { EnvoyerMessageGroupeCommandHandler } from '../../application/commands/envoyer-message-groupe.command.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { CustomSwaggerApiOAuth2 } from '../decorators/swagger.decorator'
import { handleResult } from './result.handler'
import { EnvoyerMessagePayload } from './validation/messages.input'

@Controller('messages')
@CustomSwaggerApiOAuth2()
@ApiTags('Messages')
export class MessagesController {
  constructor(
    private envoyerMessageGroupeCommandHandler: EnvoyerMessageGroupeCommandHandler
  ) {}

  @Post()
  async envoyerMessage(
    @Body() payload: EnvoyerMessagePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.envoyerMessageGroupeCommandHandler.execute(
      {
        message: payload.message,
        iv: payload.iv,
        idsBeneficiaires: payload.idsBeneficiaires,
        idsListesDeDiffusion: payload.idsListesDeDiffusion,
        idConseiller: payload.idConseiller,
        infoPieceJointe: payload.infoPieceJointe
      },
      utilisateur
    )

    return handleResult(result)
  }
}
