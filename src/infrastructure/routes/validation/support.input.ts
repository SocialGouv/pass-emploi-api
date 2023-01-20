import { ApiProperty } from '@nestjs/swagger'
import { ValidateIf } from 'class-validator'

export class TeleverserCsvPayload {
  @ApiProperty({ type: 'string', format: 'binary' })
  @ValidateIf(() => false)
  fichier: Express.Multer.File
}
