import { ApiProperty } from '@nestjs/swagger'
import { OffresImmersion } from '../../../domain/offre-immersion'

export class ContactImmersionQueryModel {
  @ApiProperty()
  id: string
  @ApiProperty()
  nom: string
  @ApiProperty()
  prenom: string
  @ApiProperty()
  role: string
  @ApiProperty()
  email?: string
  @ApiProperty()
  telephone?: string
  @ApiProperty()
  modeDeContact?: OffresImmersion.MethodeDeContact
}

export class LocalisationQueryModel {
  @ApiProperty()
  latitude: number
  @ApiProperty()
  longitude: number
}

export class OffreImmersionQueryModel {
  @ApiProperty()
  id: string
  @ApiProperty()
  metier: string
  @ApiProperty()
  nomEtablissement: string
  @ApiProperty()
  secteurActivite: string
  @ApiProperty()
  ville: string
}

export class DetailOffreImmersionQueryModel extends OffreImmersionQueryModel {
  @ApiProperty()
  estVolontaire: boolean
  @ApiProperty()
  adresse: string
  @ApiProperty({
    required: false
  })
  localisation?: LocalisationQueryModel
  @ApiProperty({
    required: false
  })
  contact?: ContactImmersionQueryModel
}
