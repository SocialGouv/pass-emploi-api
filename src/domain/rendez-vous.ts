import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel,
  TypesEvenementsQueryModel
} from '../application/queries/query-models/rendez-vous.query-models'
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

export enum TypeEvenement {
  ACTIVITE = 'Activités extérieures',
  ATELIER = 'Atelier',
  ENTRETIEN_CONSEILLER = 'Entretien individuel conseiller',
  ENTRETIEN_PARTENAIRE = 'Entretien par un partenaire',
  INFORMATION = 'Information collective',
  VISITE = 'Visite',
  AUTRE = 'Autre'
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
    getAllAVenir(): Promise<RendezVous[]>
    delete(idRendezVous: string): Promise<void>
    getAllQueryModelsByConseiller(
      idConseiller: string
    ): Promise<RendezVousConseillerQueryModel>
    getAllQueryModelsByJeune(idJeune: string): Promise<RendezVousQueryModel[]>
    getTypesEvenementsQueryModel(): TypesEvenementsQueryModel
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
