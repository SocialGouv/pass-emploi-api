import { ApiProperty } from '@nestjs/swagger'

export class IdQueryModel {
  @ApiProperty()
  id: string
}
