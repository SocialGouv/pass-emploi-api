import { ApiProperty } from '@nestjs/swagger'

export interface RendezVousBaseQueryModel {
  id: string
  title: string
  comment?: string
  modality: string
}

export class RendezVousQueryModel implements RendezVousBaseQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  title: string

  @ApiProperty({ required: false })
  comment?: string

  @ApiProperty()
  modality: string

  @ApiProperty()
  date: Date

  @ApiProperty()
  duration: number
}

export class RendezVousConseillerQueryModel {
  @ApiProperty({
    type: RendezVousQueryModel,
    isArray: true
  })
  futurs: RendezVousQueryModel[]

  @ApiProperty({
    type: RendezVousQueryModel,
    isArray: true
  })
  passes: RendezVousQueryModel[]
}
