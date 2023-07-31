import { ActionQueryModel, DemarcheQueryModel } from './actions.query-model'
import { RendezVousJeuneQueryModel } from './rendez-vous.query-model'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SessionJeuneMiloQueryModel } from 'src/application/queries/query-models/sessions.milo.query.model'

export class JeuneHomeAgendaQueryModel {
  @ApiProperty({
    type: ActionQueryModel,
    isArray: true
  })
  actions: ActionQueryModel[]

  @ApiProperty({
    type: RendezVousJeuneQueryModel,
    isArray: true
  })
  rendezVous: RendezVousJeuneQueryModel[]

  @ApiProperty({
    type: SessionJeuneMiloQueryModel,
    isArray: true
  })
  sessionsMilo: SessionJeuneMiloQueryModel[]

  metadata: {
    actionsEnRetard: number
    dateDeDebut: Date
    dateDeFin: Date
  }
}

export class JeuneHomeAgendaPoleEmploiQueryModel {
  @ApiProperty({
    type: DemarcheQueryModel,
    isArray: true
  })
  demarches: DemarcheQueryModel[]

  @ApiProperty({
    type: RendezVousJeuneQueryModel,
    isArray: true
  })
  rendezVous: RendezVousJeuneQueryModel[]

  metadata: {
    demarchesEnRetard: number
    dateDeDebut: Date
    dateDeFin: Date
  }
}

export class JeuneHomeAgendaPoleEmploiQueryModelV2 {
  @ApiProperty({
    type: JeuneHomeAgendaPoleEmploiQueryModel
  })
  resultat: JeuneHomeAgendaPoleEmploiQueryModel

  @ApiPropertyOptional()
  dateDerniereMiseAJour?: Date
}
