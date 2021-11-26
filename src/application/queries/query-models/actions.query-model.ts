import { ApiProperty } from '@nestjs/swagger'
import { Action } from '../../../domain/action'

class JeuneActionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string
}

export class ActionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  content: string

  @ApiProperty()
  comment: string

  @ApiProperty()
  creationDate: string

  @ApiProperty()
  lastUpdate: string

  @ApiProperty()
  status: Action.Statut

  @ApiProperty()
  creatorType: Action.TypeCreateur

  @ApiProperty()
  creator: string

  @ApiProperty({
    required: false
  })
  jeune?: JeuneActionQueryModel
}
