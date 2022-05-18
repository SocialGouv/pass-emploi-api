import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Redirect,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums/http-status.enum'
import { ConfigService } from '@nestjs/config'
import { RuntimeException } from '@nestjs/core/errors/exceptions/runtime.exception'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiConsumes, ApiOAuth2, ApiTags } from '@nestjs/swagger'
import {
  UploadFileCommand,
  UploadFileCommandHandler,
  UploadFileCommandOutput
} from '../../application/commands/upload-file.command.handler'
import { isSuccess } from '../../building-blocks/types/result'
import { OidcQueryToken } from '../decorators/skip-oidc-auth.decorator'
import { UploadFilePayload } from './validation/files.inputs'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { Authentification } from '../../domain/authentification'

@Controller('files')
@ApiTags('Files')
export class FilesController {
  private client: S3Client
  private logger: Logger

  constructor(
    private configService: ConfigService,
    private uploadFileCommandHandler: UploadFileCommandHandler
  ) {
    this.logger = new Logger('FilesController')
    this.client = new S3Client({
      region: this.configService.get('s3.region'),
      credentials: {
        accessKeyId: this.configService.get('s3.accessKeyId')!,
        secretAccessKey: this.configService.get('s3.secretAccessKey')!
      },
      endpoint: this.configService.get('s3.endpoint')!
    })
  }

  @Get(':idFile')
  @Redirect('blank', HttpStatus.PERMANENT_REDIRECT)
  @ApiOAuth2([])
  @OidcQueryToken()
  async getFileRedirected(
    @Param('idFile') idFile: string
  ): Promise<{ url: string; statusCode: number }> {
    this.logger.log(idFile)
    const keyFile = 'pj/uneImage.jpeg'
    const command = new GetObjectCommand({
      Bucket: this.configService.get('s3.bucket')!,
      Key: keyFile,
      ResponseContentType: 'image/png',
      ResponseContentDisposition: 'attachment; filename="gad_le_magnifik.png"'
    })
    const url = await getSignedUrl(this.client, command, { expiresIn: 10 })
    return {
      url,
      statusCode: HttpStatus.TEMPORARY_REDIRECT
    }
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOAuth2([])
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
    const result = await this.uploadFileCommandHandler.execute(
      uploadFileCommand,
      utilisateur
    )

    if (isSuccess(result)) {
      return result.data
    }

    throw new RuntimeException()
  }
}
