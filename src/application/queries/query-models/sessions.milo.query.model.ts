import { ApiProperty } from '@nestjs/swagger'

export class SessionTypeQueryModel {
  @ApiProperty()
  code: string

  @ApiProperty()
  label: string
}

export class SessionConseillerMiloQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nomSession: string

  @ApiProperty()
  nomOffre: string

  @ApiProperty()
  dateHeureDebut: string

  @ApiProperty()
  dateHeureFin: string

  @ApiProperty()
  type: SessionTypeQueryModel
}

class DetailSessionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  dateHeureDebut: string

  @ApiProperty()
  dateHeureFin: string

  @ApiProperty({ required: false })
  dateMaxInscription?: string

  @ApiProperty()
  animateur: string

  @ApiProperty()
  lieu: string

  @ApiProperty({ required: false })
  nbPlacesDisponibles?: number

  @ApiProperty({ required: false })
  commentaire?: string
}

class OffreSessionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  theme: string

  @ApiProperty()
  type: SessionTypeQueryModel

  @ApiProperty({ required: false })
  description?: string

  @ApiProperty({ required: false })
  nomPartenaire?: string
}

export class DetailSessionConseillerMiloQueryModel {
  @ApiProperty()
  session: DetailSessionQueryModel

  @ApiProperty()
  offre: OffreSessionQueryModel
}
