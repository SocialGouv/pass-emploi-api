import { ApiPropertyOptional } from '@nestjs/swagger'

export class AgenceQueryModel {
  constructor(id: string, nom: string) {
    this.id = id
    this.nom = nom
  }

  @ApiPropertyOptional({ type: 'string' })
  id?: string

  @ApiPropertyOptional({ type: 'string' })
  nom?: string
}
