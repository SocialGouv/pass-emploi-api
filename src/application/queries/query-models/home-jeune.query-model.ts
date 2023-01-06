import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  RendezVous,
  TypeRendezVous
} from '../../../domain/rendez-vous/rendez-vous'
import { ActionQueryModel, DemarcheQueryModel } from './actions.query-model'
import { RendezVousBaseQueryModel } from './rendez-vous.query-model'
import { CampagneQueryModel } from './campagne.query-model'

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

  @ApiProperty({ required: true, enum: RendezVous.Source })
  source: RendezVous.Source
}

export class ConseillerJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiPropertyOptional()
  email?: string
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
    type: ConseillerJeuneQueryModel
  })
  conseiller: ConseillerJeuneQueryModel

  @ApiProperty({
    type: RendezVousJeuneHomeQueryModel,
    isArray: true
  })
  rendezvous: RendezVousJeuneHomeQueryModel[]
}

export class JeuneHomeActionQueryModel {
  @ApiProperty({
    type: ActionQueryModel,
    isArray: true
  })
  actions: ActionQueryModel[]

  @ApiProperty({
    type: CampagneQueryModel,
    required: false
  })
  campagne?: CampagneQueryModel
}

export class JeuneHomeDemarcheQueryModel {
  @ApiProperty({
    type: DemarcheQueryModel,
    isArray: true
  })
  actions: DemarcheQueryModel[]

  @ApiProperty({
    type: CampagneQueryModel,
    required: false
  })
  campagne?: CampagneQueryModel
}

export class JeuneHomeDemarcheQueryModelV2 {
  @ApiProperty({
    type: JeuneHomeDemarcheQueryModel
  })
  resultat: JeuneHomeDemarcheQueryModel

  @ApiPropertyOptional()
  dateDerniereMiseAJour?: Date
}
