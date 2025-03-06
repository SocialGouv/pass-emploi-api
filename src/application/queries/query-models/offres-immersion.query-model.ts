import { ApiProperty } from '@nestjs/swagger'
import { Offre } from '../../../domain/offre/offre'

export class ContactImmersionQueryModel {
  @ApiProperty()
  modeDeContact: Offre.Immersion.MethodeDeContact
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
  @ApiProperty()
  estVolontaire: boolean
}

export class ObsoleteFavoriOffreImmersionQueryModel {
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

export class FavoriOffreImmersionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty({
    format: 'date-time',
    required: false
  })
  dateCandidature?: string
}

export class DetailOffreImmersionQueryModel extends OffreImmersionQueryModel {
  @ApiProperty()
  codeRome: string

  @ApiProperty()
  siret: string

  @ApiProperty()
  adresse: string

  @ApiProperty({
    required: false,
    type: LocalisationQueryModel
  })
  localisation?: LocalisationQueryModel

  @ApiProperty({
    required: false
  })
  contact?: ContactImmersionQueryModel
}
