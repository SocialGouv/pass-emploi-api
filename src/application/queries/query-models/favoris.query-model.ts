import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Offre } from '../../../domain/offre/offre'
import { OrigineOffreEmploiQueryModel } from './offres-emploi.query-model'

export class FavorisQueryModel {
  @ApiProperty()
  idOffre: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  type: Offre.Favori.Type

  @ApiProperty({ format: 'date-time' })
  dateCreation: string

  @ApiPropertyOptional()
  organisation?: string

  @ApiPropertyOptional()
  localisation?: string

  @ApiPropertyOptional({
    format: 'date-time',
    required: false
  })
  dateCandidature?: string

  @ApiProperty({
    type: String,
    isArray: true
  })
  tags: string[]

  @ApiProperty({ required: false })
  origine?: OrigineOffreEmploiQueryModel
}

class MetadonneesFavorisOffresJeuneQueryModel {
  @ApiProperty()
  total: number
  @ApiProperty()
  nombreOffresImmersion: number
  @ApiProperty()
  nombreOffresServiceCivique: number
  @ApiProperty()
  nombreOffresAlternance: number
  @ApiProperty()
  nombreOffresEmploi: number
}

class MetadonneesFavorisRecherchesJeuneQueryModel {
  @ApiProperty()
  total: number
  @ApiProperty()
  nombreRecherchesOffresImmersion: number
  @ApiProperty()
  nombreRecherchesOffresServiceCivique: number
  @ApiProperty()
  nombreRecherchesOffresAlternance: number
  @ApiProperty()
  nombreRecherchesOffresEmploi: number
}

class MetadonneesFavorisJeuneQueryModel {
  @ApiProperty()
  autoriseLePartage: boolean

  @ApiProperty({ type: MetadonneesFavorisOffresJeuneQueryModel })
  offres: MetadonneesFavorisOffresJeuneQueryModel

  @ApiProperty({ type: MetadonneesFavorisRecherchesJeuneQueryModel })
  recherches: MetadonneesFavorisRecherchesJeuneQueryModel
}

export class MetadonneesFavorisQueryModel {
  @ApiProperty({ type: MetadonneesFavorisJeuneQueryModel })
  favoris: MetadonneesFavorisJeuneQueryModel
}
