import { ApiPropertyOptional } from '@nestjs/swagger'

export class AgenceQueryModel implements AgenceRessource {
  constructor(id: string, nom: string) {
    this.id = id
    this.nom = nom
  }

  @ApiPropertyOptional({ type: 'string' })
  id?: string

  @ApiPropertyOptional({ type: 'string' })
  nom?: string
}

export interface AgenceRessource {
  id?: string
  nom?: string
}
