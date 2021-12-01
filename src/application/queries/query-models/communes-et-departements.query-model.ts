import { ApiProperty } from '@nestjs/swagger'

export class CommunesEtDepartementsQueryModel {
  @ApiProperty()
  code: string

  @ApiProperty()
  libelle: string

  @ApiProperty()
  codePostal?: string

  @ApiProperty()
  type: CommunesEtDepartementsQueryModel.Type

  @ApiProperty()
  score: number
}

export namespace CommunesEtDepartementsQueryModel {
  export enum Type {
    COMMUNE = 'COMMUNE',
    DEPARTEMENT = 'DEPARTEMENT'
  }
}
