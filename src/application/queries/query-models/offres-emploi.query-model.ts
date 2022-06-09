import { ApiProperty } from '@nestjs/swagger'

export class LocalisationQueryModel {
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
  localisation?: LocalisationQueryModel

  @ApiProperty({ required: false })
  alternance?: boolean

  @ApiProperty({ required: false })
  duree?: string
}

class Pagination {
  @ApiProperty()
  page: number

  @ApiProperty()
  limit: number
}

export class OffresEmploiQueryModel {
  @ApiProperty({
    type: Pagination
  })
  pagination: Pagination

  @ApiProperty({
    type: OffreEmploiResumeQueryModel,
    isArray: true
  })
  results: OffreEmploiResumeQueryModel[]
}

export interface FavoriOffreEmploiIdQueryModel {
  id: string
}
