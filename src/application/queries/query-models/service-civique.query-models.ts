import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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
