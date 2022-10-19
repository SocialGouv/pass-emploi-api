import { ApiProperty } from '@nestjs/swagger'

export class AgenceQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  codeDepartement: string
}
