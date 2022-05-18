import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
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
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiOAuth2, ApiTags } from '@nestjs/swagger'
import { IdService } from '../../utils/id-service'
import { Public } from '../decorators/public.decorator'
import { OidcQueryToken } from '../decorators/skip-oidc-auth.decorator'

@Controller('files')
// @Public()
@ApiTags('Files')
export class FilesController {
  private client: S3Client
  private logger: Logger

  constructor(
    private idService: IdService,
    private configService: ConfigService
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
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<string> {
    const input: PutObjectCommandInput = {
      Bucket: 'pass-emploi',
      Body: file.buffer,
      ContentType: file.mimetype,
      Key: this.idService.uuid()
    }
    const command = new PutObjectCommand(input)
    const response = await this.client.send(command)
    return response.VersionId!
  }
}
