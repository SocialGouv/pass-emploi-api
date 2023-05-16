import { ApiProperty } from '@nestjs/swagger'
import { PaginationQueryModel } from './common/pagination.query-model'

class EvenementEmploiQueryModel {
  @ApiProperty({ required: false })
  id: number

  @ApiProperty({ required: false })
  ville: string

  @ApiProperty({ required: false })
  codePostal: string

  @ApiProperty({ required: false })
  titre: string

  @ApiProperty({ required: false })
  type: string

  @ApiProperty({ required: false })
  dateEvenement: string

  @ApiProperty({ required: false })
  heureDebut: string

  @ApiProperty({ required: false })
  heureFin: string

  @ApiProperty({ required: false })
  modalites: string[]
}

export class EvenementsEmploiQueryModel {
  @ApiProperty({
    type: PaginationQueryModel
  })
  pagination: PaginationQueryModel

  @ApiProperty({
    type: EvenementEmploiQueryModel
  })
  results: EvenementEmploiQueryModel[]
}
