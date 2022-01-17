import { ApiProperty } from '@nestjs/swagger'

export class DetailConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string
}
