import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous,
  RendezVous,
  TypeRendezVous
} from '../../../domain/rendez-vous/rendez-vous'

class JeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string

  @ApiPropertyOptional()
  futPresent?: boolean
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

export class RendezVousJeuneQueryModel implements RendezVousBaseQueryModel {
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
    description: descriptionTypeRdv()
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

class LogModificationRendezVousQueryModel {
  @ApiProperty()
  date: string

  @ApiProperty()
  auteur: ConseillerQueryModel
}

export class RendezVousConseillerQueryModel
  implements RendezVousBaseQueryModel
{
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
  invitation: boolean

  @ApiProperty({
    description: descriptionTypeRdv()
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

  @ApiProperty()
  jeunes: JeuneQueryModel[]

  @ApiProperty({ required: false })
  createur?: {
    id: string
    nom: string
    prenom: string
  }
}

export class AnimationCollectiveQueryModel extends RendezVousConseillerQueryModel {
  @ApiPropertyOptional()
  statut: RendezVous.AnimationCollective.Statut
}

export class RendezVousConseillerDetailQueryModel extends RendezVousConseillerQueryModel {
  @ApiPropertyOptional()
  statut?: RendezVous.AnimationCollective.Statut

  @ApiPropertyOptional({
    type: LogModificationRendezVousQueryModel,
    isArray: true
  })
  historique?: LogModificationRendezVousQueryModel[]
}

export class AnimationCollectiveJeuneQueryModel extends RendezVousJeuneQueryModel {
  @ApiProperty()
  estInscrit: boolean
}

export class RendezVousConseillerFutursEtPassesQueryModel {
  @ApiProperty({
    type: RendezVousConseillerQueryModel,
    isArray: true
  })
  futurs: RendezVousConseillerQueryModel[]

  @ApiProperty({
    type: RendezVousConseillerQueryModel,
    isArray: true
  })
  passes: RendezVousConseillerQueryModel[]
}

export class TypeRendezVousQueryModel implements TypeRendezVous {
  @ApiProperty()
  code: CodeTypeRendezVous
  @ApiProperty()
  label: string
}

function descriptionTypeRdv(): string | undefined {
  return Object.values(CodeTypeRendezVous)
    .map(code => {
      return JSON.stringify({
        code,
        label: mapCodeLabelTypeRendezVous[code]
      })
    })
    .join(' | ')
}
