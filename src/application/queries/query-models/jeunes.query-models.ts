import { ApiProperty } from '@nestjs/swagger'
import { Jeune } from 'src/domain/jeune'
import { ActionQueryModel } from './actions.query-model'
import { DetailConseillerQueryModel } from './conseillers.query-models'
import { RendezVousQueryModel } from './rendez-vous.query-models'

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
}

export class JeuneHomeQueryModel {
  @ApiProperty({
    type: ActionQueryModel,
    isArray: true
  })
  actions: ActionQueryModel[]

  @ApiProperty()
  doneActionsCount: number

  @ApiProperty({
    type: DetailConseillerQueryModel
  })
  conseiller: DetailConseillerQueryModel

  @ApiProperty({
    type: RendezVousQueryModel,
    isArray: true
  })
  rendezvous: RendezVousQueryModel[]
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
