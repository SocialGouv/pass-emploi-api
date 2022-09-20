import { ApiProperty } from '@nestjs/swagger'
import { Offre } from '../../../domain/offre/offre'

export class FavorisQueryModel {
  @ApiProperty()
  idOffre: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  type: Offre.Favori.Type

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
