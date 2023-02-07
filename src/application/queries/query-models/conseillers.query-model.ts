import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsISO8601, IsString } from 'class-validator'
import { PaginationQueryModel } from './commun/pagination.query-model'

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

export class ActionAQualifierQueryModel {
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
  dateFinReelle: string
}

export class GetActionsDuConseillerAQualifierQueryModel {
  @ApiProperty({ type: PaginationQueryModel })
  pagination: PaginationQueryModel

  @ApiProperty({ type: ActionAQualifierQueryModel })
  @IsArray()
  resultats: ActionAQualifierQueryModel[]
}
