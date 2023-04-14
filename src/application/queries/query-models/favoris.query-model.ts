import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Offre } from '../../../domain/offre/offre'

export class FavorisQueryModel {
  @ApiProperty()
  idOffre: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  type: Offre.Favori.Type

  @ApiPropertyOptional()
  organisation?: string

  @ApiPropertyOptional()
  localisation?: string

  @ApiPropertyOptional({
    format: 'date-time',
    required: false
  })
  dateCreation?: string

  @ApiProperty({
    type: String,
    isArray: true
  })
  tags: string[]
}

class MetadonneesFavorisOffresJeuneQueryModel {
  total: number
  nombreOffresImmersion: number
  nombreOffresServiceCivique: number
  nombreOffresAlternance: number
  nombreOffresEmploi: number
}

class MetadonneesFavorisRecherchesJeuneQueryModel {
  total: number
  nombreRecherchesOffresImmersion: number
  nombreRecherchesOffresServiceCivique: number
  nombreRecherchesOffresAlternance: number
  nombreRecherchesOffresEmploi: number
}

class MetadonneesFavorisJeuneQueryModel {
  autoriseLePartage: boolean
  offres: MetadonneesFavorisOffresJeuneQueryModel
  recherches: MetadonneesFavorisRecherchesJeuneQueryModel
}

export class MetadonneesFavorisQueryModel {
  @ApiProperty()
  favoris: MetadonneesFavorisJeuneQueryModel
}
