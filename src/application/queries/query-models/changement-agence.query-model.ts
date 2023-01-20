import { ApiProperty } from '@nestjs/swagger'

export class JeuneDesinscrit {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

export class ChangementAgenceQueryModel {
  @ApiProperty()
  idAnimationCollective: string

  @ApiProperty()
  titreAnimationCollective: string

  @ApiProperty({ isArray: true, type: JeuneDesinscrit })
  jeunesDesinscrits: JeuneDesinscrit[]

  @ApiProperty()
  idAncienneAgence: string

  @ApiProperty()
  idNouvelleAgence: string
}
