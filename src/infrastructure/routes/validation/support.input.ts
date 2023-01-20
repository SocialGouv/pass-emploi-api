import { ApiProperty } from '@nestjs/swagger'

export class TeleverserCsvPayload {
  @ApiProperty({ type: 'string', format: 'binary' })
  fichier: Express.Multer.File
}
