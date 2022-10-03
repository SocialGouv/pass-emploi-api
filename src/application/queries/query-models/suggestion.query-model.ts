import { ApiProperty } from '@nestjs/swagger'
import { Offre } from '../../../domain/offre/offre'

export class SuggestionQueryModel {
  @ApiProperty()
  id: string
  @ApiProperty()
  titre: string
  @ApiProperty({ enum: Offre.Recherche.Type })
  type: Offre.Recherche.Type
  @ApiProperty()
  metier?: string
  @ApiProperty()
  localisation?: string
  @ApiProperty({ type: Date })
  dateCreation: string
  @ApiProperty({ type: Date })
  dateRafraichissement: string
}
