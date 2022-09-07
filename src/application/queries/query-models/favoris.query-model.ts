import { ApiProperty } from '@nestjs/swagger'
import { Favori } from '../../../domain/favori'

export class FavorisQueryModel {
  @ApiProperty()
  idOffre: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  type: Favori.TypeOffre

  @ApiProperty()
  organisation?: string

  @ApiProperty()
  localisation?: string
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
