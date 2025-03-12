import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Offre } from '../../../domain/offre/offre'

class Pagination {
  @ApiProperty()
  total: number
}

class LocalisationServiceCiviqueQueryModel {
  @ApiProperty()
  latitude: number

  @ApiProperty()
  longitude: number
}

export class ServiceCiviqueQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty({
    enum: Offre.ServiceCivique.Domaine
  })
  domaine: string

  @ApiProperty()
  titre: string

  @ApiPropertyOptional()
  ville?: string

  @ApiPropertyOptional()
  organisation?: string

  @ApiPropertyOptional({
    example: '2022-02-15T10:12:14.000Z'
  })
  dateDeDebut?: string

  @ApiPropertyOptional()
  localisation?: LocalisationServiceCiviqueQueryModel
}

export class FavoriOffreServiceCiviqueQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty({
    format: 'date-time',
    required: false
  })
  dateCandidature?: string
}

export class ServicesCiviqueQueryModel {
  @ApiProperty({ type: Pagination })
  pagination: Pagination

  @ApiProperty({ type: ServiceCiviqueQueryModel, isArray: true })
  results: ServiceCiviqueQueryModel[]
}

export class DetailServiceCiviqueQueryModel {
  @ApiProperty({
    enum: Offre.ServiceCivique.Domaine
  })
  domaine: string

  @ApiProperty()
  titre: string

  @ApiPropertyOptional()
  ville?: string

  @ApiPropertyOptional()
  organisation?: string

  @ApiPropertyOptional({
    example: '2022-02-15T10:12:14.000Z'
  })
  dateDeDebut?: string

  @ApiPropertyOptional({
    example: '2022-02-15T10:12:14.000Z'
  })
  dateDeFin?: string

  @ApiPropertyOptional()
  description?: string

  @ApiPropertyOptional()
  lienAnnonce?: string

  @ApiPropertyOptional()
  adresseOrganisation?: string

  @ApiPropertyOptional()
  adresseMission?: string

  @ApiPropertyOptional()
  urlOrganisation?: string

  @ApiPropertyOptional()
  codeDepartement?: string

  @ApiPropertyOptional()
  codePostal?: string

  @ApiPropertyOptional()
  descriptionOrganisation?: string
}
