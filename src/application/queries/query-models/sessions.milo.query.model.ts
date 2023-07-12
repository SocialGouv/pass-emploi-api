import { ApiProperty } from '@nestjs/swagger'
import { SessionMilo } from '../../../domain/milo/session.milo'

export class SessionTypeQueryModel {
  @ApiProperty({
    description: '2 valeurs possibles: WORKSHOP ou COLLECTIVE_INFORMATION'
  })
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
  estVisible: boolean

  @ApiProperty()
  dateHeureDebut: string

  @ApiProperty()
  dateHeureFin: string

  @ApiProperty()
  type: SessionTypeQueryModel
}

export class SessionJeuneMiloQueryModel {
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

class DetailSessionConseillerQueryModel {
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

  @ApiProperty()
  estVisible: boolean

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

export class InscritSessionMiloQueryModel {
  @ApiProperty()
  idJeune: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string

  @ApiProperty({ enum: SessionMilo.Inscription.Statut })
  statut: SessionMilo.Inscription.Statut
}

export class DetailSessionConseillerMiloQueryModel {
  @ApiProperty()
  session: DetailSessionConseillerQueryModel

  @ApiProperty()
  offre: OffreSessionQueryModel

  @ApiProperty({ type: InscritSessionMiloQueryModel, isArray: true })
  inscriptions: InscritSessionMiloQueryModel[]
}

export class DetailSessionJeuneMiloQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nomSession: string

  @ApiProperty()
  nomOffre: string

  @ApiProperty()
  theme: string

  @ApiProperty()
  type: SessionTypeQueryModel

  @ApiProperty()
  dateHeureDebut: string

  @ApiProperty()
  dateHeureFin: string

  @ApiProperty()
  lieu: string

  @ApiProperty()
  animateur: string

  @ApiProperty({ required: false })
  nomPartenaire?: string

  @ApiProperty({ required: false })
  description?: string

  @ApiProperty({ required: false })
  commentaire?: string

  @ApiProperty({ required: false })
  dateMaxInscription?: string

  @ApiProperty({ required: false })
  nbPlacesDisponibles?: number
}
