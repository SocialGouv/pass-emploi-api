import { ApiProperty } from '@nestjs/swagger'
import { Polygon } from 'geojson'
import { Offre } from '../../../domain/offre/offre'

export class RechercheQueryModel {
  @ApiProperty()
  id: string
  @ApiProperty()
  titre: string
  @ApiProperty()
  type: string
  @ApiProperty()
  metier?: string
  @ApiProperty()
  localisation?: string
  @ApiProperty()
  criteres:
    | Offre.Recherche.Emploi
    | Offre.Recherche.Immersion
    | Offre.Recherche.ServiceCivique
  @ApiProperty()
  geometrie?: Polygon
}
