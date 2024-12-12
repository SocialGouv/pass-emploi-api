import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Action } from 'src/domain/action/action'
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

  @ApiProperty({ required: false })
  dateSignatureCGU?: string

  @ApiProperty({ required: false })
  dateVisionnageActus?: string
}

class JeuneDuConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

class CategorieActionQueryModel {
  @ApiProperty()
  code: Action.Qualification.Code

  @ApiProperty()
  libelle: string
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

  @ApiPropertyOptional({ type: CategorieActionQueryModel })
  categorie?: CategorieActionQueryModel
}

export class GetActionsConseillerV2QueryModel {
  @ApiProperty({ type: PaginationQueryModel })
  pagination: PaginationQueryModel

  @ApiProperty({ type: ActionResumeV2QueryModel, isArray: true })
  resultats: ActionResumeV2QueryModel[]
}

export class CompteursBeneficiaireQueryModel {
  @ApiProperty()
  idBeneficiaire: string

  @ApiProperty()
  actions: number

  @ApiProperty()
  rdvs: number

  @ApiProperty()
  sessions: number
}
