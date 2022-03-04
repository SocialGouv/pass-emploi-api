import { ApiProperty } from '@nestjs/swagger'
import { TypeRendezVous } from 'src/domain/rendez-vous'
import { ActionQueryModel } from './actions.query-model'
import { DetailConseillerQueryModel } from './conseillers.query-models'
import { RendezVousBaseQueryModel } from './rendez-vous.query-models'

class RendezVousJeuneHomeQueryModel implements RendezVousBaseQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  title: string

  @ApiProperty({ required: false })
  comment?: string

  @ApiProperty()
  modality: string

  @ApiProperty()
  date: string

  @ApiProperty()
  dateUtc: string

  @ApiProperty()
  duration: string

  @ApiProperty()
  type: TypeRendezVous

  @ApiProperty({ required: false })
  precision?: string

  @ApiProperty({ required: false })
  adresse?: string

  @ApiProperty({ required: false })
  organisme?: string

  @ApiProperty()
  presenceConseiller: boolean
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
    type: RendezVousJeuneHomeQueryModel,
    isArray: true
  })
  rendezvous: RendezVousJeuneHomeQueryModel[]
}
