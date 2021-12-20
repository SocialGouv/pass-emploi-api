import { ApiProperty } from '@nestjs/swagger'
import { Jeune } from 'src/domain/jeune'

export class DetailJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty({
    required: false
  })
  creationDate?: string

  @ApiProperty({
    required: false
  })
  authenticationId?: string | null
}

export class ResumeActionsDuJeuneQueryModel {
  @ApiProperty()
  jeuneId: Jeune.Id

  @ApiProperty()
  jeuneFirstName: string

  @ApiProperty()
  jeuneLastName: string

  @ApiProperty()
  todoActionsCount: number

  @ApiProperty()
  doneActionsCount: number

  @ApiProperty()
  inProgressActionsCount: number
}
