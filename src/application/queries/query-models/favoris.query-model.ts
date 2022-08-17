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
