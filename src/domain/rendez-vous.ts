import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel,
  TypesRendezVousQueryModel
} from '../application/queries/query-models/rendez-vous.query-models'
import { IdService } from '../utils/id-service'
import { Jeune } from './jeune'

export const RendezVousRepositoryToken = 'RendezVous.Repository'

export enum CodeTypeRendezVous {
  ACTIVITE_EXTERIEURES = 'ACTIVITE_EXTERIEURES',
  ATELIER = 'ATELIER',
  ENTRETIEN_INDIVIDUEL_CONSEILLER = 'ENTRETIEN_INDIVIDUEL_CONSEILLER',
  ENTRETIEN_PARTENAIRE = 'ENTRETIEN_PARTENAIRE',
  INFORMATION_COLLECTIVE = 'INFORMATION_COLLECTIVE',
  VISITE = 'VISITE',
  AUTRE = 'AUTRE'
}

export const mapCodeLabelTypeRendezVous: Record<CodeTypeRendezVous, string> = {
  ACTIVITE_EXTERIEURES: 'Activités extérieures',
  ATELIER: 'Atelier',
  ENTRETIEN_INDIVIDUEL_CONSEILLER: 'Entretien individuel conseiller',
  ENTRETIEN_PARTENAIRE: 'Entretien par un partenaire',
  INFORMATION_COLLECTIVE: 'Information collective',
  VISITE: 'Visite',
  AUTRE: 'Autre'
}

export interface TypeRendezVous {
  code: CodeTypeRendezVous
  label: string
}

export interface RendezVous {
  id: string
  titre: string
  sousTitre: string
  commentaire?: string
  modalite?: string
  date: Date
  duree: number
  jeune: Jeune
  type: CodeTypeRendezVous
  precision?: string
  adresse?: string
  organisme?: string
  presenceConseiller: boolean
}

interface InfosRendezVousACreer {
  idJeune: string
  idConseiller: string
  commentaire?: string
  date: string
  duree: number
  modalite?: string
  type?: string
  precision?: string
  adresse?: string
  organisme?: string
  presenceConseiller?: boolean
}

export namespace RendezVous {
  export interface Repository {
    add(rendezVous: RendezVous): Promise<void>
    get(id: string): Promise<RendezVous | undefined>
    getAllAVenir(): Promise<RendezVous[]>
    delete(idRendezVous: string): Promise<void>
    getAllQueryModelsByConseiller(
      idConseiller: string,
      presenceConseiller?: boolean
    ): Promise<RendezVousConseillerQueryModel>
    getAllQueryModelsByJeune(idJeune: string): Promise<RendezVousQueryModel[]>
    getTypesRendezVousQueryModel(): TypesRendezVousQueryModel
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
      titre: 'Rendez-vous conseiller',
      type: infosRendezVousACreer.type
        ? (infosRendezVousACreer.type as CodeTypeRendezVous)
        : CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      precision: infosRendezVousACreer.precision,
      adresse: infosRendezVousACreer.adresse,
      organisme: infosRendezVousACreer.organisme,
      presenceConseiller:
        infosRendezVousACreer.presenceConseiller === undefined
          ? true
          : infosRendezVousACreer.presenceConseiller
    }
  }
}
