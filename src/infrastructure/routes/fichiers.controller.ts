import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Redirect,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums/http-status.enum'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiOAuth2, ApiTags } from '@nestjs/swagger'
import { handleResult } from './result.handler'
import { SupprimerFichierCommandHandler } from '../../application/commands/supprimer-fichier.command.handler'
import { TelechargerFichierQueryHandler } from '../../application/queries/telecharger-fichier.query.handler'
import {
  TeleverserFichierCommand,
  TeleverserFichierCommandHandler,
  TeleverserFichierCommandOutput
} from '../../application/commands/televerser-fichier.command.handler'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { OidcQueryToken } from '../decorators/skip-oidc-auth.decorator'
import { TeleverserFichierPayload } from './validation/fichiers.inputs'

@Controller('fichiers')
@ApiOAuth2([])
@ApiTags('Fichiers')
export class FilesController {
  constructor(
    private telechargerFichierQueryHandler: TelechargerFichierQueryHandler,
    private televerserFichierCommandHandler: TeleverserFichierCommandHandler,
    private supprimerFichierCommandHandler: SupprimerFichierCommandHandler
  ) {}

  @Get(':idFichier')
  @Redirect('blank', HttpStatus.PERMANENT_REDIRECT)
  @OidcQueryToken()
  async getFichierRedirected(
    @Param('idFichier', new ParseUUIDPipe()) idFichier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<{ url: string; statusCode: number }> {
    const result = await this.telechargerFichierQueryHandler.execute(
      { idFichier },
      utilisateur
    )

    return handleResult(result, url => ({
      url,
      statusCode: HttpStatus.TEMPORARY_REDIRECT
    }))
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('fichier'))
  async postFichier(
    @UploadedFile() fichier: Express.Multer.File,
    @Body() payload: TeleverserFichierPayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<TeleverserFichierCommandOutput> {
    const command: TeleverserFichierCommand = {
      fichier: {
        buffer: fichier.buffer,
        mimeType: fichier.mimetype,
        name: payload.nom ?? fichier.originalname,
        size: fichier.size
      },
      jeunesIds: payload.jeunesIds,
      listesDeDiffusionIds: payload.listesDeDiffusionIds
    }
    const result = await this.televerserFichierCommandHandler.execute(
      command,
      utilisateur
    )

    return handleResult(result)
  }

  @Delete(':idFichier')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFichier(
    @Param('idFichier', new ParseUUIDPipe()) idFichier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const result = await this.supprimerFichierCommandHandler.execute(
      { idFichier },
      utilisateur
    )

    return handleResult(result)
  }
}
