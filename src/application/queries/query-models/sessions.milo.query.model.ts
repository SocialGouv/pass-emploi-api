import { ApiProperty } from '@nestjs/swagger'

export class SessionTypeQueryModel {
  @ApiProperty()
  code: string

  @ApiProperty()
  label: string
}

export class SessionConseillerMiloQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nomSession: string

  @ApiProperty()
  nomOffre: string

  @ApiProperty()
  dateHeureDebut: string

  @ApiProperty()
  dateHeureFin: string

  @ApiProperty()
  type: SessionTypeQueryModel
}
