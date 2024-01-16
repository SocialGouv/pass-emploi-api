import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { PaginationQueryModel } from './common/pagination.query-model'

class AgenceDuConseillerQueryModel {
  @ApiProperty({ required: false })
  id?: string

  @ApiProperty()
  nom: string
}

class StructureMiloDuConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string
}

export class ConseillerSimpleQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string

  @ApiProperty({ required: false })
  email?: string
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

  @ApiProperty({ required: false })
  structureMilo?: StructureMiloDuConseillerQueryModel

  @ApiProperty()
  notificationsSonores: boolean

  @ApiProperty()
  aDesBeneficiairesARecuperer: boolean

  @ApiProperty()
  dateSignatureCGU?: string
}

class JeuneDuConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

class ActionResumeV2QueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  titre: string

  @ApiProperty({ type: JeuneDuConseillerQueryModel })
  jeune: JeuneDuConseillerQueryModel

  @ApiPropertyOptional({
    description: 'Toujours présent quand aQualifier=true',
    format: 'date-time'
  })
  dateFinReelle?: string

  @ApiPropertyOptional()
  categorie?: string
}

export class GetActionsConseillerV2QueryModel {
  @ApiProperty({ type: PaginationQueryModel })
  pagination: PaginationQueryModel

  @ApiProperty({ type: ActionResumeV2QueryModel, isArray: true })
  resultats: ActionResumeV2QueryModel[]
}
