import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Offre } from '../../../domain/offre/offre'

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
