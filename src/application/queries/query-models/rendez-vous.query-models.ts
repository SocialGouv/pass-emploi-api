import { ApiProperty } from '@nestjs/swagger'
import { TypeRendezVous } from 'src/domain/rendez-vous'

class JeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

class ConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

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

  @ApiProperty()
  jeune: JeuneQueryModel

  @ApiProperty({ required: false })
  conseiller?: ConseillerQueryModel
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

export type TypesRendezVousQueryModel = TypeRendezVous[]
