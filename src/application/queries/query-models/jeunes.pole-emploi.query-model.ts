import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import {
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModel
} from './rendez-vous.query-model'
import { RechercheQueryModel } from './recherches.query-model'
import { FavorisQueryModel } from './favoris.query-model'
import { CampagneQueryModel } from './campagne.query-model'

class ResumeSemaineJeune {
  @ApiProperty()
  nombreRendezVous: number

  @ApiProperty()
  nombreActionsDemarchesEnRetard: number

  @ApiProperty()
  nombreActionsDemarchesARealiser: number

  @ApiProperty()
  nombreActionsDemarchesAFaireSemaineCalendaire: number
}

export class AccueilJeunePoleEmploiQueryModel {
  @ApiProperty({
    required: false
  })
  dateDerniereMiseAJour?: string

  @ApiProperty()
  cetteSemaine: ResumeSemaineJeune

  @ApiProperty()
  prochainRendezVous?: RendezVousJeuneQueryModel

  @ApiProperty({
    required: false
  })
  evenementsAVenir?: RendezVousJeuneDetailQueryModel[]

  @ApiProperty()
  mesAlertes: RechercheQueryModel[]

  @ApiPropertyOptional()
  mesFavoris: FavorisQueryModel[]

  @ApiPropertyOptional()
  campagne?: CampagneQueryModel
}

export class CVPoleEmploiQueryModel {
  @ApiProperty()
  titre: string

  @ApiProperty()
  url: string

  @ApiProperty()
  nomFichier: string
}
