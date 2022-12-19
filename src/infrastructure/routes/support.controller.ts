import { Body, Controller, Post } from '@nestjs/common'
import { ApiOAuth2, ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsBoolean, IsString } from 'class-validator'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import {
  RefreshJddCommand,
  RefreshJddCommandHandler
} from '../../application/commands/refresh-jdd.command.handler'
import { isFailure } from '../../building-blocks/types/result'
import { handleFailure } from './failure.handler'

export class RefreshJDDPayload {
  @ApiProperty()
  @IsString()
  idConseiller: string

  @ApiProperty()
  @IsBoolean()
  menage: boolean
}

@ApiOAuth2([])
@Controller()
@ApiTags('Support')
export class SupportController {
  constructor(private refreshJddCommandHandler: RefreshJddCommandHandler) {}

  @Post('jdd')
  async refresh(
    @Body() payload: RefreshJDDPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: RefreshJddCommand = {
      idConseiller: payload.idConseiller,
      menage: payload.menage
    }
    const result = await this.refreshJddCommandHandler.execute(
      command,
      utilisateur
    )
    if (isFailure(result)) {
      return handleFailure(result)
    }
  }
}
