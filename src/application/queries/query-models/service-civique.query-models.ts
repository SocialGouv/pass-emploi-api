import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { OffreEngagement } from '../../../domain/offre-engagement'

export class OffreEngagementQueryModel implements OffreEngagement {
  @ApiProperty()
  id: string
  @ApiProperty({
    enum: OffreEngagement.Domaine
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
}

export class DetailOffreEngagementQueryModel {
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
  @ApiProperty({
    example: '2022-02-15T10:12:14.000Z'
  })
  dateDeFin: string
  @ApiProperty()
  description: string
  @ApiProperty()
  lienAnnonce: string
  @ApiProperty()
  adresseOrganisation: string
  @ApiProperty()
  adresseMission: string
  @ApiProperty()
  urlOrganisation: string
  @ApiProperty()
  codeDepartement: string
  @ApiProperty()
  codePostal: string
  @ApiProperty()
  descriptionOrganisation: string
}
