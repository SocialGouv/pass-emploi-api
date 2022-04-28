import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AgenceQueryModel } from './agence.query-models'

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
  agence?: AgenceQueryModel
}
