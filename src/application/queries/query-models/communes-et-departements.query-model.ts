import { ApiProperty } from '@nestjs/swagger'

export enum CommuneOuDepartementType {
  COMMUNE = 'COMMUNE',
  DEPARTEMENT = 'DEPARTEMENT'
}

export class CommunesEtDepartementsQueryModel {
  @ApiProperty()
  code: string

  @ApiProperty()
  libelle: string

  @ApiProperty({ enum: CommuneOuDepartementType })
  type: CommuneOuDepartementType

  @ApiProperty()
  score: number

  @ApiProperty({ required: false })
  codePostal?: string

  @ApiProperty({ required: false })
  longitude?: number

  @ApiProperty({ required: false })
  latitude?: number
}
