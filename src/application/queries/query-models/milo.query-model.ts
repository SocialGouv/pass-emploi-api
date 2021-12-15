import { ApiProperty } from '@nestjs/swagger'

export class DossierJeuneMiloQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  prenom: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  dateDeNaissance: string

  @ApiProperty({ required: false })
  email?: string
}
