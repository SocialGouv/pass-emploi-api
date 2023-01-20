import { ApiProperty } from '@nestjs/swagger'

export class TeleverserCsvPayload {
  @ApiProperty()
  fichier: Express.Multer.File
}
