import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Fichier, FichierMetadata } from '../../domain/fichier'

@Injectable()
export class ObjectStorageClient {
  private client: S3Client

  constructor(private configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.get('s3.region'),
      credentials: {
        accessKeyId: this.configService.get('s3.accessKeyId')!,
        secretAccessKey: this.configService.get('s3.secretAccessKey')!
      },
      endpoint: this.configService.get('s3.endpoint')!
    })
  }

  async uploader(fichier: Fichier): Promise<void> {
    const input: PutObjectCommandInput = {
      Bucket: this.configService.get('s3.bucket'),
      Body: fichier.buffer,
      ContentType: fichier.mimeType,
      Key: `${this.configService.get('s3.bucket_prefix_pieces_jointes')}${
        fichier.id
      }`
    }
    const putObjectCommand = new PutObjectCommand(input)
    await this.client.send(putObjectCommand)
  }

  async download(fichier: FichierMetadata): Promise<string> {
    const bucketPrefix = this.configService.get(
      's3.bucket_prefix_pieces_jointes'
    )
    const command = new GetObjectCommand({
      Bucket: this.configService.get('s3.bucket'),
      Key: `${bucketPrefix}${fichier.id}`,
      ResponseContentType: fichier.mimeType,
      ResponseContentDisposition: `attachment; filename="${fichier.nom}"`
    })

    return getSignedUrl(this.client, command, { expiresIn: 10 })
  }
}
