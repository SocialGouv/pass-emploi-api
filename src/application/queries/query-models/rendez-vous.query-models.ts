import { ApiProperty } from '@nestjs/swagger'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous,
  TypeRendezVous
} from 'src/domain/rendez-vous'

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

  @ApiProperty({
    description: Object.values(CodeTypeRendezVous)
      .map(code => {
        return JSON.stringify({
          code,
          label: mapCodeLabelTypeRendezVous[code]
        })
      })
      .join(' | ')
  })
  type: TypeRendezVous

  @ApiProperty({ required: false })
  precision?: string

  @ApiProperty({ required: false })
  adresse?: string

  @ApiProperty({ required: false })
  organisme?: string

  @ApiProperty({ required: false })
  presenceConseiller?: boolean

  @ApiProperty({ required: false })
  description?: string

  @ApiProperty({ required: false })
  telephone?: string

  @ApiProperty({ required: false })
  theme?: string

  @ApiProperty({ required: false })
  visio?: boolean

  @ApiProperty({ required: false })
  annule?: boolean

  @ApiProperty({ required: false })
  lienVisio?: string

  @ApiProperty({ required: false })
  agencePE?: boolean

  @ApiProperty({ required: false })
  idStable?: string

  @ApiProperty({ required: false })
  invitation?: boolean

  @ApiProperty()
  isLocaleDate: boolean

  @ApiProperty()
  jeune: JeuneQueryModel

  @ApiProperty({ required: false })
  conseiller?: ConseillerQueryModel

  @ApiProperty({
    required: false,
    description: 'Créateur non existant pour les API Pôle Emploi'
  })
  createur?: {
    id: string
    nom: string
    prenom: string
  }
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
