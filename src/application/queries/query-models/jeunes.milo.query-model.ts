import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import {
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModel
} from './rendez-vous.query-model'
import { RechercheQueryModel } from './recherches.query-model'
import { FavorisQueryModel } from './favoris.query-model'
import { CampagneQueryModel } from './campagne.query-model'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'

class ResumeSemaineJeune {
  @ApiProperty()
  nombreRendezVous: number

  @ApiProperty()
  nombreActionsDemarchesEnRetard: number

  @ApiProperty()
  nombreActionsDemarchesARealiser: number
}

export class AccueilJeuneMiloQueryModel {
  @ApiProperty()
  cetteSemaine: ResumeSemaineJeune

  @ApiProperty()
  prochainRendezVous?: RendezVousJeuneQueryModel

  @ApiProperty()
  prochaineSessionMilo?: SessionJeuneMiloQueryModel

  @ApiProperty({
    required: false
  })
  evenementsAVenir: RendezVousJeuneDetailQueryModel[]

  @ApiProperty()
  mesAlertes: RechercheQueryModel[]

  @ApiPropertyOptional()
  mesFavoris: FavorisQueryModel[]

  @ApiPropertyOptional()
  campagne?: CampagneQueryModel
}
