import { ApiProperty } from '@nestjs/swagger'

export class DetailJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  creationDate: string
}
