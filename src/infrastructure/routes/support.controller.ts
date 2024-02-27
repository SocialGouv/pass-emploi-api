import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiOAuth2, ApiOperation, ApiTags } from '@nestjs/swagger'
import { handleResult } from './result.handler'
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
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import {
  ChangerAgenceConseillerPayload,
  RefreshJDDPayload,
  TeleverserCsvPayload,
  TransfererJeunesPayload
} from './validation/support.inputs'
import { TransfererJeunesConseillerCommandHandler } from '../../application/commands/transferer-jeunes-conseiller.command.handler'
import { CreerSuperviseursCommandHandler } from '../../application/commands/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from '../../application/commands/delete-superviseurs.command.handler'
import { SuperviseursPayload } from './validation/conseillers.inputs'

@ApiOAuth2([])
@Controller('support')
@ApiTags('Support')
export class SupportController {
  constructor(
    private refreshJddCommandHandler: RefreshJddCommandHandler,
    private mettreAJourLesJeunesCejPeCommandHandler: MettreAJourLesJeunesCejPeCommandHandler,
    private updateAgenceCommandHandler: UpdateAgenceConseillerCommandHandler,
    private archiverJeuneSupportCommandHandler: ArchiverJeuneSupportCommandHandler,
    private transfererJeunesConseillerCommandHandler: TransfererJeunesConseillerCommandHandler,
    private readonly creerSuperviseursCommandHandler: CreerSuperviseursCommandHandler,
    private readonly deleteSuperviseursCommandHandler: DeleteSuperviseursCommandHandler
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

    return handleResult(result)
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

    return handleResult(result)
  }

  @ApiOperation({
    summary:
      'Attribue une nouvelle agence au conseiller identifié par son ID (ID en base, et pas ID Authentification)',
    description: 'Autorisé pour le support'
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

    return handleResult(result)
  }

  @ApiOperation({
    summary:
      'Archive le jeune identifié par son ID (ID en base, et pas ID Authentification)',
    description:
      ' l’API support pour archiver le jeune\n' +
      '- Suppression de la BDD de son compte utilisateur\n' +
      '- Suppression de l’authentification Keycloak\n' +
      '- Suppression du chat firebase\n' +
      '- Envoi d’un email au jeune\n'
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

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Transférer les jeunes renseignés d’un conseiller à un autre',
    description: 'Autorisé pour le support'
  })
  @Post('transferer-jeunes')
  @HttpCode(HttpStatus.NO_CONTENT)
  async transfererJeunesSupport(
    @Body() payload: TransfererJeunesPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.transfererJeunesConseillerCommandHandler.execute(
      {
        idConseillerSource: payload.idConseillerSource,
        idConseillerCible: payload.idConseillerCible,
        idsJeunes: payload.idsJeunes,
        estTemporaire: false,
        provenanceUtilisateur: Authentification.Type.SUPPORT
      },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Ajoute des droits de supervision à des conseillers',
    description: 'Autorisé pour le support'
  })
  @Post('superviseurs')
  async postSuperviseurs(
    @Body() superviseursPayload: SuperviseursPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.creerSuperviseursCommandHandler.execute(
      { superviseurs: superviseursPayload.superviseurs },
      utilisateur
    )

    return handleResult(result)
  }

  @ApiOperation({
    summary: 'Supprime des droits de supervision à des conseillers',
    description: 'Autorisé pour le support'
  })
  @Delete('superviseurs')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSuperviseurs(
    @Body() superviseursPayload: SuperviseursPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.deleteSuperviseursCommandHandler.execute(
      { superviseurs: superviseursPayload.superviseurs },
      utilisateur
    )

    return handleResult(result)
  }
}
