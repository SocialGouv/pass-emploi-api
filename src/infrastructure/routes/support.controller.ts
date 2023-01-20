import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { ApiConsumes, ApiOAuth2, ApiTags } from '@nestjs/swagger'
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
import {
  ChangementAgencePayload,
  RefreshJDDPayload,
  TeleverserCsvPayload
} from './validation/support.input'
import { ChangerAgenceCommandHandler } from '../../application/commands/changer-agence.command.handler'
import { ChangementAgenceQueryModel } from '../../application/queries/query-models/changement-agence.query-model'

@ApiOAuth2([])
@Controller('support')
@ApiTags('Support')
export class SupportController {
  constructor(
    private refreshJddCommandHandler: RefreshJddCommandHandler,
    private mettreAJourLesJeunesCejPeCommandHandler: MettreAJourLesJeunesCejPeCommandHandler,
    private changerAgenceCommandHandler: ChangerAgenceCommandHandler
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

  @Post('changement-agence')
  async postChangementAgence(
    @Body() payload: ChangementAgencePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<ChangementAgenceQueryModel[]> {
    const command: ChangementAgencePayload = {
      idConseiller: payload.idConseiller,
      idAgenceCible: payload.idAgenceCible
    }
    const result = await this.changerAgenceCommandHandler.execute(
      command,
      utilisateur
    )
    if (isFailure(result)) {
      throw handleFailure(result)
    }
    return result.data
  }
}
