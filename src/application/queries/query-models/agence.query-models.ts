import { ApiProperty } from '@nestjs/swagger'

export class AgenceQueryModel {
  constructor(id: string, nom: string) {
    this.id = id
    this.nom = nom
  }

  @ApiProperty({ type: 'string' })
  id: string

  @ApiProperty({ type: 'string' })
  nom: string
}
