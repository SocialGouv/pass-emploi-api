import { ApiProperty } from '@nestjs/swagger'
import { Action, ActionPoleEmploi } from '../../../domain/action'
import { JeuneQueryModel } from './jeunes.query-models'

export class ActionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  content: string

  @ApiProperty()
  comment: string

  @ApiProperty()
  creationDate: string

  @ApiProperty()
  lastUpdate: string

  @ApiProperty()
  status: Action.Statut

  @ApiProperty()
  creatorType: Action.TypeCreateur

  @ApiProperty()
  creator: string

  @ApiProperty({
    type: JeuneQueryModel,
    required: false
  })
  jeune?: JeuneQueryModel
}

export class AttributDemarcheQueryModel {
  @ApiProperty()
  label: string

  @ApiProperty()
  valeur: string | number

  @ApiProperty()
  cle: string
}

export class DemarcheQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty({ required: false })
  contenu?: string

  @ApiProperty()
  statut: ActionPoleEmploi.Statut

  @ApiProperty()
  dateFin: Date

  @ApiProperty()
  label: string

  @ApiProperty()
  titre: string

  @ApiProperty({ required: false })
  sousTitre?: string

  @ApiProperty()
  dateCreation: Date

  @ApiProperty({ required: false })
  dateModification?: Date

  @ApiProperty({ required: false })
  dateAnnulation?: Date

  @ApiProperty()
  creeeParConseiller: boolean

  @ApiProperty()
  modifieParConseiller: boolean

  @ApiProperty({ type: AttributDemarcheQueryModel, isArray: true })
  attributs: AttributDemarcheQueryModel[]

  @ApiProperty()
  codeDemarche: string

  @ApiProperty({ isArray: true, enum: ActionPoleEmploi.Statut })
  statutsPossibles: ActionPoleEmploi.Statut[]
}
