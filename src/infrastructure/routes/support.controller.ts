import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ChangementAgenceQueryModel,
  UpdateAgenceConseillerCommandHandler
} from '../../application/commands/support/update-agence-conseiller.command.handler'
import {
  MettreAJourLesJeunesCejPeCommandHandler,
  MettreAJourLesJeunesCEJPoleEmploiCommand
} from '../../application/commands/mettre-a-jour-les-jeunes-cej-pe.command.handler'
import {
  RefreshJddCommand,
  RefreshJddCommandHandler
} from '../../application/commands/refresh-jdd.command.handler'
import { ArchiverJeuneSupportCommandHandler } from '../../application/commands/support/archiver-jeune-support.command.handler'
import { isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'
import {
  ChangerAgenceConseillerPayload,
  RefreshJDDPayload,
  TeleverserCsvPayload
} from './validation/support.input'

@ApiOAuth2([])
@Controller('support')
@ApiTags('Support')
export class SupportController {
  constructor(
    private refreshJddCommandHandler: RefreshJddCommandHandler,
    private mettreAJourLesJeunesCejPeCommandHandler: MettreAJourLesJeunesCejPeCommandHandler,
    private updateAgenceCommandHandler: UpdateAgenceConseillerCommandHandler,
    private archiverJeuneSupportCommandHandler: ArchiverJeuneSupportCommandHandler
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
    @Body() _payload: TeleverserCsvPayload,
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

  @ApiOperation({
    summary:
      'Attribue une nouvelle agence au conseiller identifié par son ID (ID en base, et pas ID Authentification).',
    description: 'Autorisé pour le support.'
  })
  @Post('changer-agence-conseiller')
  async changerAgenceConseiller(
    @Body() payload: ChangerAgenceConseillerPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ChangementAgenceQueryModel> {
    const command: ChangerAgenceConseillerPayload = {
      idConseiller: payload.idConseiller,
      idNouvelleAgence: payload.idNouvelleAgence
    }
    const result = await this.updateAgenceCommandHandler.execute(
      command,
      utilisateur
    )
    if (isFailure(result)) {
      throw handleFailure(result)
    }
    return result.data
  }

  @ApiOperation({
    summary:
      'Archive le jeune identifié par son ID (ID en base, et pas ID Authentification).',
    description: 'Autorisé pour le support.'
  })
  @Post('archiver-jeune/:idJeune')
  @HttpCode(HttpStatus.NO_CONTENT)
  async archiverJeune(
    @Param('idJeune') idJeune: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.archiverJeuneSupportCommandHandler.execute(
      {
        idJeune
      },
      utilisateur
    )
    handleFailure(result)
  }
}
