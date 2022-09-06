import { ActionQueryModel, DemarcheQueryModel } from './actions.query-model'
import { RendezVousJeuneQueryModel } from './rendez-vous.query-model'

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
  demarches: DemarcheQueryModel[]
  rendezVous: RendezVousJeuneQueryModel[]
  metadata: {
    demarchesEnRetard: number
    dateDeDebut: Date
    dateDeFin: Date
  }
}
