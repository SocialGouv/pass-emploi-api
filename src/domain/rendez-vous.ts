import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel,
  TypesRendezVousQueryModel
} from '../application/queries/query-models/rendez-vous.query-models'
import { IdService } from '../utils/id-service'
import { Jeune } from './jeune'
import { Conseiller } from './conseiller'

export const RendezVousRepositoryToken = 'RendezVous.Repository'

export enum CodeTypeRendezVous {
  ACTIVITE_EXTERIEURES = 'ACTIVITE_EXTERIEURES',
  ATELIER = 'ATELIER',
  ENTRETIEN_INDIVIDUEL_CONSEILLER = 'ENTRETIEN_INDIVIDUEL_CONSEILLER',
  ENTRETIEN_PARTENAIRE = 'ENTRETIEN_PARTENAIRE',
  INFORMATION_COLLECTIVE = 'INFORMATION_COLLECTIVE',
  VISITE = 'VISITE',
  PRESTATION = 'PRESTATION',
  AUTRE = 'AUTRE'
}

export const mapCodeLabelTypeRendezVous: Record<CodeTypeRendezVous, string> = {
  ACTIVITE_EXTERIEURES: 'Activités extérieures',
  ATELIER: 'Atelier',
  ENTRETIEN_INDIVIDUEL_CONSEILLER: 'Entretien individuel conseiller',
  ENTRETIEN_PARTENAIRE: 'Entretien par un partenaire',
  INFORMATION_COLLECTIVE: 'Information collective',
  VISITE: 'Visite',
  PRESTATION: 'Prestation',
  AUTRE: 'Autre'
}

export interface TypeRendezVous {
  code: CodeTypeRendezVous
  label: string
}

export interface Createur {
  id: string
  nom: string
  prenom: string
}

export interface RendezVous {
  id: string
  titre: string
  sousTitre: string
  commentaire?: string
  modalite?: string
  date: Date
  duree: number
  jeune: Pick<
    Jeune,
    | 'id'
    | 'firstName'
    | 'lastName'
    | 'conseiller'
    | 'pushNotificationToken'
    | 'email'
  >
  type: CodeTypeRendezVous
  precision?: string
  adresse?: string
  organisme?: string
  presenceConseiller: boolean
  invitation?: boolean
  icsSequence?: number
  createur: Createur
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
  invitation?: boolean
}

export namespace RendezVous {
  export interface Repository {
    save(rendezVous: RendezVous): Promise<void>
    get(id: string): Promise<RendezVous | undefined>
    getAllAVenir(): Promise<RendezVous[]>
    delete(idRendezVous: string): Promise<void>
    getAllQueryModelsByConseiller(
      idConseiller: string,
      presenceConseiller?: boolean
    ): Promise<RendezVousConseillerQueryModel>
    getAllQueryModelsByJeune(idJeune: string): Promise<RendezVousQueryModel[]>
    getRendezVousPassesQueryModelsByJeune(
      idJeune: string
    ): Promise<RendezVousQueryModel[]>
    getRendezVousFutursQueryModelsByJeune(
      idJeune: string
    ): Promise<RendezVousQueryModel[]>
    getTypesRendezVousQueryModel(): TypesRendezVousQueryModel
    getQueryModelById(
      idRendezVous: string
    ): Promise<RendezVousQueryModel | undefined>
  }

  export enum Periode {
    PASSES = 'PASSES',
    FUTURS = 'FUTURS'
  }

  export function createRendezVousConseiller(
    infosRendezVousACreer: InfosRendezVousACreer,
    jeune: Jeune,
    conseiller: Conseiller,
    idService: IdService
  ): RendezVous {
    return {
      id: idService.uuid(),
      commentaire: infosRendezVousACreer.commentaire,
      duree: infosRendezVousACreer.duree,
      date: new Date(infosRendezVousACreer.date),
      modalite: infosRendezVousACreer.modalite,
      jeune: {
        id: jeune.id,
        firstName: jeune.firstName,
        lastName: jeune.lastName,
        conseiller: jeune.conseiller,
        pushNotificationToken: jeune.pushNotificationToken,
        email: jeune.email
      },
      sousTitre: `avec ${jeune.conseiller!.firstName}`,
      titre: 'Rendez-vous conseiller',
      type: infosRendezVousACreer.type
        ? (infosRendezVousACreer.type as CodeTypeRendezVous)
        : CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      precision: infosRendezVousACreer.precision,
      adresse: infosRendezVousACreer.adresse,
      organisme: infosRendezVousACreer.organisme,
      invitation: infosRendezVousACreer.invitation,
      presenceConseiller:
        infosRendezVousACreer.presenceConseiller === undefined
          ? true
          : infosRendezVousACreer.presenceConseiller,
      createur: {
        id: conseiller.id,
        nom: conseiller.lastName,
        prenom: conseiller.firstName
      }
    }
  }
}
