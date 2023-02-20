import { ApiProperty } from '@nestjs/swagger'
import { PaginationQueryModel } from './common/pagination.query-model'
import { JeuneMiloResumeQueryModel } from './jeunes.query-model'

export class AgenceQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  codeDepartement: string
}

export class GetJeunesEtablissementV2QueryModel {
  @ApiProperty({ type: PaginationQueryModel })
  pagination: PaginationQueryModel

  @ApiProperty({ type: JeuneMiloResumeQueryModel, isArray: true })
  resultats: JeuneMiloResumeQueryModel[]
}
