import { ApiProperty } from '@nestjs/swagger'
import { Action, ActionPoleEmploi } from '../../../domain/action'
import { DetailJeuneQueryModel } from './jeunes.query-models'

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
    type: DetailJeuneQueryModel,
    required: false
  })
  jeune?: DetailJeuneQueryModel
}

export class ActionPoleEmploiQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty({ required: false })
  contenu?: string

  @ApiProperty()
  statut: ActionPoleEmploi.Statut

  @ApiProperty()
  dateFin: Date

  @ApiProperty({ required: false })
  dateAnnulation?: Date

  @ApiProperty()
  creeParConseiller: boolean
}
