import { ActionQueryModel, DemarcheQueryModel } from './actions.query-model'
import { RendezVousJeuneQueryModel } from './rendez-vous.query-model'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class JeuneHomeSuiviQueryModel {
  actions: ActionQueryModel[]
  rendezVous: RendezVousJeuneQueryModel[]
  metadata: {
    actionsEnRetard: number
    dateDeDebut: Date
    dateDeFin: Date
  }
}

export class JeuneHomeEvenementsQueryModel {
  actions: ActionQueryModel[]
  rendezVous: RendezVousJeuneQueryModel[]
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
