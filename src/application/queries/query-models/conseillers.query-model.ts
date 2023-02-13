import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsISO8601, IsString } from 'class-validator'
import { PaginationQueryModel } from './common/pagination.query-model'

class AgenceDuConseillerQueryModel {
  @ApiProperty({ required: false })
  id?: string

  @ApiProperty()
  nom: string
}

export class DetailConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiPropertyOptional()
  email?: string

  @ApiProperty({ required: false })
  agence?: AgenceDuConseillerQueryModel

  @ApiProperty()
  notificationsSonores: boolean

  @ApiProperty()
  aDesBeneficiairesARecuperer: boolean
}

class JeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

export class ActionV2QueryModel {
  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  titre: string

  @ApiProperty({ type: JeuneQueryModel })
  jeune: JeuneQueryModel

  @ApiProperty()
  @IsISO8601()
  dateFinReelle?: string
}

export class GetActionsConseillerV2QueryModel {
  @ApiProperty({ type: PaginationQueryModel })
  pagination: PaginationQueryModel

  @ApiProperty({ type: ActionV2QueryModel })
  @IsArray()
  resultats: ActionV2QueryModel[]
}
