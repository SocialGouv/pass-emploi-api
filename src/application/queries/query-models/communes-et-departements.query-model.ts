import { ApiProperty } from '@nestjs/swagger'

export class CommunesEtDepartementsQueryModel {
  @ApiProperty()
  code: string

  @ApiProperty()
  libelle: string

  @ApiProperty()
  type: CommunesEtDepartementsQueryModel.Type

  @ApiProperty()
  score: number

  @ApiProperty({ required: false })
  codePostal?: string

  @ApiProperty({ required: false })
  longitude?: number

  @ApiProperty({ required: false })
  latitude?: number
}

export namespace CommunesEtDepartementsQueryModel {
  export enum Type {
    COMMUNE = 'COMMUNE',
    DEPARTEMENT = 'DEPARTEMENT'
  }
}
