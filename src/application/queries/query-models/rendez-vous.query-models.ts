import { ApiProperty } from '@nestjs/swagger'

export class RendezVousQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  title: string

  @ApiProperty({ required: false })
  comment?: string

  @ApiProperty()
  date: Date

  @ApiProperty()
  duration: number

  @ApiProperty()
  modality: string
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
