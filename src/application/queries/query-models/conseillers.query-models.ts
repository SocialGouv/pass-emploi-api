import { ApiProperty } from '@nestjs/swagger'
import { Conseiller } from 'src/domain/conseiller'

export class DetailConseillerQueryModel {
  @ApiProperty()
  id: Conseiller.Id

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string
}
