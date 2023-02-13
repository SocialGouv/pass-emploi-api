import { ApiProperty } from '@nestjs/swagger'
import { PaginationQueryModel } from './commun/pagination.query-model'

export class LocalisationOffresEmploiQueryModel {
  @ApiProperty({ required: false })
  nom?: string

  @ApiProperty({ required: false })
  codePostal?: string

  @ApiProperty({ required: false })
  commune?: string
}

export class OffreEmploiQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  data: unknown

  @ApiProperty({
    type: String,
    nullable: true
  })
  urlRedirectPourPostulation: string | null
}

export class OffreEmploiResumeQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  typeContrat: string

  @ApiProperty({ required: false })
  nomEntreprise?: string

  @ApiProperty({ required: false })
  localisation?: LocalisationOffresEmploiQueryModel

  @ApiProperty({ required: false })
  alternance?: boolean

  @ApiProperty({ required: false })
  duree?: string
}

export class OffresEmploiQueryModel {
  @ApiProperty({
    type: PaginationQueryModel
  })
  pagination: PaginationQueryModel

  @ApiProperty({
    type: OffreEmploiResumeQueryModel,
    isArray: true
  })
  results: OffreEmploiResumeQueryModel[]
}

export interface FavoriOffreEmploiIdQueryModel {
  id: string
}
