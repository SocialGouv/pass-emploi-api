import { ApiProperty } from '@nestjs/swagger'
import { FindOffresEmploiQueryParams } from '../../../infrastructure/routes/validation/offres-emploi.inputs'
import { GetOffresImmersionQueryParams } from '../../../infrastructure/routes/validation/offres-immersion.inputs'
import { Polygon } from 'geojson'

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
  criteres?: FindOffresEmploiQueryParams | GetOffresImmersionQueryParams
  @ApiProperty()
  geometrie?: Polygon
}
