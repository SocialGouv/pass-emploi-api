import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class AgenceDuConseillerQueryModel {
  @ApiProperty({ required: false })
  id?: string

  @ApiProperty()
  nom: string
}

export class DetailConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiPropertyOptional()
  email?: string

  @ApiProperty({ required: false })
  agence?: AgenceDuConseillerQueryModel

  @ApiProperty()
  notificationsSonores: boolean

  @ApiProperty()
  aDesBeneficiairesARecuperer: boolean
}
