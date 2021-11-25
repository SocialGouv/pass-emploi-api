import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel
} from '../application/queries/query-models/rendez-vous.query-model'
import { IdService } from '../utils/id-service'
import { Jeune } from './jeune'

export const RendezVousRepositoryToken = 'RendezVous.Repository'

export interface RendezVous {
  id: string
  titre: string
  sousTitre: string
  commentaire?: string
  modalite: string
  date: Date
  duree: number
  jeune: Jeune
}

interface InfosRendezVousACreer {
  idJeune: string
  idConseiller: string
  commentaire?: string
  date: string
  duree: number
  modalite: string
}

export namespace RendezVous {
  export interface Repository {
    add(rendezVous: RendezVous): Promise<void>
    get(id: string): Promise<RendezVous | undefined>
    delete(idRendezVous: string): Promise<void>
    getAllQueryModelsByConseiller(
      idConseiller: string
    ): Promise<RendezVousConseillerQueryModel>
    getAllQueryModelsByJeune(idJeune: string): Promise<RendezVousQueryModel[]>
  }

  export function createRendezVousConseiller(
    infosRendezVousACreer: InfosRendezVousACreer,
    jeune: Jeune,
    idService: IdService
  ): RendezVous {
    return {
      id: idService.uuid(),
      commentaire: infosRendezVousACreer.commentaire,
      duree: infosRendezVousACreer.duree,
      date: new Date(infosRendezVousACreer.date),
      modalite: infosRendezVousACreer.modalite,
      jeune,
      sousTitre: `avec ${jeune.conseiller.firstName}`,
      titre: 'Rendez-vous conseiller'
    }
  }
}
