import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SessionMilo } from '../../../domain/milo/session.milo'

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
  autoinscription: boolean

  @ApiProperty()
  dateHeureDebut: string

  @ApiProperty()
  dateHeureFin: string

  @ApiProperty()
  type: SessionTypeQueryModel

  @ApiProperty({ enum: SessionMilo.Statut })
  statut: SessionMilo.Statut

  @ApiProperty()
  nombreParticipants: number

  @ApiPropertyOptional()
  nombreMaxParticipants?: number
}

export class AgendaConseillerMiloSessionListItemQueryModel {
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

  @ApiProperty({ type: InscritSessionMiloQueryModel, isArray: true })
  beneficiaires: InscritSessionMiloQueryModel[]

  @ApiProperty()
  nbInscrits: number

  @ApiPropertyOptional()
  nbPlacesRestantes?: number
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

  @ApiPropertyOptional({ enum: SessionMilo.Inscription.Statut })
  inscription?: SessionMilo.Inscription.Statut

  @ApiProperty()
  autoinscription: boolean

  @ApiPropertyOptional()
  dateMaxInscription?: string

  @ApiPropertyOptional()
  nbPlacesRestantes?: number
}

export class DetailSessionConseillerQueryModel {
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

  @ApiProperty()
  autoinscription: boolean

  @ApiProperty({ required: false })
  nbPlacesDisponibles?: number

  @ApiProperty({ required: false })
  commentaire?: string

  @ApiProperty({ enum: SessionMilo.Statut })
  statut: SessionMilo.Statut
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
  session: DetailSessionConseillerQueryModel

  @ApiProperty()
  offre: OffreSessionQueryModel

  @ApiProperty({ type: InscritSessionMiloQueryModel, isArray: true })
  inscriptions: InscritSessionMiloQueryModel[]
}

export class DetailSessionJeuneMiloInscriptionQueryModel {
  @ApiProperty({ enum: SessionMilo.Inscription.Statut })
  statut: SessionMilo.Inscription.Statut
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

  @ApiProperty({ required: false })
  inscription?: DetailSessionJeuneMiloInscriptionQueryModel
}
