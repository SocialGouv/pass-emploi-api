import { ApiProperty } from '@nestjs/swagger'
import { OffreEngagement } from '../../../domain/offre-engagement'

export class OffreEngagementQueryModel {
  @ApiProperty()
  id: string
  @ApiProperty({
    enum: OffreEngagement.Domaine
  })
  domaine: string
  @ApiProperty()
  titre: string
  @ApiProperty()
  ville: string
  @ApiProperty()
  organisation: string
  @ApiProperty({
    example: '2022-02-15T10:12:14.000Z'
  })
  dateDeDebut: string
}
