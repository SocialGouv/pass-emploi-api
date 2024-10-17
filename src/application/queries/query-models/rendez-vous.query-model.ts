import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray } from 'class-validator'
import {
  CategorieRendezVous,
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous,
  RendezVous,
  TypeRendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { PaginationQueryModel } from './common/pagination.query-model'

class JeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string

  @ApiProperty({ required: false })
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
  source: RendezVous.Source
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

  @ApiProperty({ required: true, enum: RendezVous.Source })
  source: RendezVous.Source

  @ApiProperty({ required: false })
  futPresent?: boolean
}

export class RendezVousJeuneQueryModelV2 {
  @ApiProperty({
    type: RendezVousJeuneQueryModel,
    isArray: true
  })
  resultat: RendezVousJeuneQueryModel[]

  @ApiPropertyOptional()
  dateDerniereMiseAJour?: Date
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

  @ApiProperty({ required: true, enum: RendezVous.Source })
  source: RendezVous.Source

  @ApiPropertyOptional()
  nombreMaxParticipants?: number
}

export class AnimationCollectiveQueryModel extends RendezVousConseillerQueryModel {
  @ApiPropertyOptional()
  statut: RendezVous.AnimationCollective.Statut
}

export class AnimationCollectiveResumeQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  titre: string

  @ApiProperty({
    format: 'date-time',
    example: '2018-11-21T06:20:32.232Z'
  })
  date: string

  @ApiProperty()
  nombreInscrits: number
}

export class GetAnimationCollectiveV2QueryModel {
  @ApiProperty({ type: PaginationQueryModel })
  pagination: PaginationQueryModel

  @ApiProperty({
    type: AnimationCollectiveResumeQueryModel,
    isArray: true
  })
  @IsArray()
  resultats: AnimationCollectiveResumeQueryModel[]
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

export class RendezVousJeuneDetailQueryModel extends RendezVousJeuneQueryModel {
  @ApiProperty()
  estInscrit: boolean
}

export class TypeRendezVousQueryModel implements TypeRendezVous {
  @ApiProperty()
  code: CodeTypeRendezVous
  @ApiProperty()
  categorie: CategorieRendezVous
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
