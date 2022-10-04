import { ApiProperty } from '@nestjs/swagger'

export class MetiersRomeQueryModel {
  @ApiProperty()
  code: string

  @ApiProperty()
  libelle: string

  @ApiProperty()
  score: number
}
