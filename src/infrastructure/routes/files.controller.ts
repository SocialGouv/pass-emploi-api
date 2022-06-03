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
  UploadFileCommand,
  UploadFileCommandHandler,
  UploadFileCommandOutput
} from '../../application/commands/upload-file.command.handler'
import { isSuccess } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { OidcQueryToken } from '../decorators/skip-oidc-auth.decorator'
import { UploadFilePayload } from './validation/files.inputs'

@Controller('files')
@ApiOAuth2([])
@ApiTags('Fichier')
export class FilesController {
  constructor(
    private telechargerFichierQueryHandler: TelechargerFichierQueryHandler,
    private televerserFichierCommandHandler: UploadFileCommandHandler
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: UploadFilePayload,
    @Utilisateur() utilisateur: Authentification.Utilisateur
  ): Promise<UploadFileCommandOutput> {
    const uploadFileCommand: UploadFileCommand = {
      file: {
        buffer: file.buffer,
        mimeType: file.mimetype,
        name: file.originalname,
        size: file.size
      },
      jeunesIds: payload.jeunesIds
    }
    const result = await this.televerserFichierCommandHandler.execute(
      uploadFileCommand,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw new RuntimeException()
  }
}
