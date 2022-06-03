import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums/http-status.enum'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiOAuth2, ApiTags } from '@nestjs/swagger'
import { TelechargerFichierQueryHandler } from 'src/application/queries/telecharger-fichier.query.handler'
import {
  TeleverserFichierCommand,
  TeleverserFichierCommandHandler,
  TeleverserFichierCommandOutput
} from '../../application/commands/televerser-fichier.command.handler'
import { isSuccess } from '../../building-blocks/types/result'
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
    private televerserFichierCommandHandler: TeleverserFichierCommandHandler
  ) {}

  @Get(':idFichier')
  @Redirect('blank', HttpStatus.PERMANENT_REDIRECT)
  @OidcQueryToken()
  async getFichierRedirected(
    @Param('idFichier') idFichier: string,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<{ url: string; statusCode: number }> {
    const result = await this.telechargerFichierQueryHandler.execute(
      {
        idFichier
      },
      utilisateur
    )

    if (isSuccess(result)) {
      return {
        url: result.data,
        statusCode: HttpStatus.TEMPORARY_REDIRECT
      }
    }
    throw new RuntimeException()
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
        name: fichier.originalname,
        size: fichier.size
      },
      jeunesIds: payload.jeunesIds,
      createur: {
        id: utilisateur.id,
        type: utilisateur.type
      }
    }
    const result = await this.televerserFichierCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }
    throw new RuntimeException()
  }
}
