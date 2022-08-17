import { ActionQueryModel } from './actions.query-model'
import { RendezVousJeuneQueryModel } from './rendez-vous.query-model'

export class JeuneHomeSuiviQueryModel {
  actions: ActionQueryModel[]
  rendezVous: RendezVousJeuneQueryModel[]
  actionsEnRetard: number
}

export class JeuneHomeEvenementsQueryModel {
  actions: ActionQueryModel[]
  rendezVous: RendezVousJeuneQueryModel[]
}
