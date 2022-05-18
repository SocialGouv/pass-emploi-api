import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, IsArray } from 'class-validator'
import { Transform } from 'class-transformer'
import { transformStringToArray } from './utils/transformers'

export class UploadFilePayload {
  @ApiProperty()
  @Transform(params => transformStringToArray(params, 'jeunesIds'))
  @IsArray()
  @ArrayNotEmpty()
  jeunesIds: string[]

  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File
}
