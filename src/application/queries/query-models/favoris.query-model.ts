import { ApiProperty } from '@nestjs/swagger'

export class FavorisQueryModel {
  @ApiProperty()
  idOffre: string

  @ApiProperty()
  titre: string

  @ApiProperty()
  entreprise: string

  @ApiProperty()
  localisation?: string
}
