import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { ApiConsumes, ApiOAuth2, ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsBoolean, IsString } from 'class-validator'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'
import {
  RefreshJddCommand,
  RefreshJddCommandHandler
} from '../../application/commands/refresh-jdd.command.handler'
import { isFailure } from '../../building-blocks/types/result'
import { handleFailure } from './failure.handler'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  MettreAJourLesJeunesCejPeCommandHandler,
  MettreAJourLesJeunesCEJPoleEmploiCommand
} from '../../application/commands/mettre-a-jour-les-jeunes-cej-pe.command.handler'

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
  constructor(
    private refreshJddCommandHandler: RefreshJddCommandHandler,
    private mettreAJourLesJeunesCejPeCommandHandler: MettreAJourLesJeunesCejPeCommandHandler
  ) {}

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

  @Post('cej/pole-emploi')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fichier'))
  async postFichierCEJ(
    @UploadedFile() fichier: Express.Multer.File,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const command: MettreAJourLesJeunesCEJPoleEmploiCommand = {
      fichier: fichier
    }
    const result = await this.mettreAJourLesJeunesCejPeCommandHandler.execute(
      command,
      utilisateur
    )
    if (isFailure(result)) {
      return handleFailure(result)
    }
  }
}
