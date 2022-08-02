import { CodeTypeRendezVous } from './rendez-vous'
import { OffreImmersion } from './offre-immersion'
import { OffreServiceCivique } from './offre-service-civique'
import { OffreEmploi } from './offre-emploi'
import { Recherche } from './recherche'

export const ArchiveJeuneRepositoryToken = 'ArchiveJeune.Repository'

export interface ArchiveJeune {
  rendezVous: ArchiveJeune.RendezVous[]
  actions: ArchiveJeune.Action[]
  favoris: {
    offresEmploi: OffreEmploi[]
    offresImmersions: OffreImmersion[]
    offresServiceCivique: OffreServiceCivique[]
  }
  recherches: Recherche[]
  dernierConseiller: {
    nom: string
    prenom: string
  }
  historiqueConseillers: Array<{
    conseillerSource: {
      nom: string
      prenom: string
    }
    conseillerCible: {
      nom: string
      prenom: string
    }
    dateDeTransfert: Date
  }>
  messages: ArchiveJeune.Message[]
}

export namespace ArchiveJeune {
  export enum MotifSuppression {
    SORTIE_POSITIVE_DU_CEJ = 'Sortie positive du CEJ',
    RADIATION_DU_CEJ = 'Radiation du CEJ',
    RECREATION_D_UN_COMPTE_JEUNE = "Recréation d'un compte jeune",
    AUTRE = 'Autre'
  }

  export interface Metadonnees {
    idJeune: string
    email?: string
    prenomJeune: string
    nomJeune: string
    motif: MotifSuppression
    commentaire?: string
    dateArchivage: Date
  }

  export interface RendezVous {
    titre: string
    sousTitre: string
    commentaire?: string
    modalite?: string
    date: Date
    duree: number
    type: CodeTypeRendezVous
    precision?: string
    adresse?: string
    organisme?: string
    presenceConseiller: boolean
  }

  export interface Action {
    statut: string
    contenu: string
    commentaire: string
    dateCreation: Date
    dateActualisation: Date
    dateEcheance?: Date
    creePar: 'JEUNE' | 'CONSEILLER'
  }

  export interface Message {
    contenu: string
    date: string
    envoyePar: string
    type: string
  }

  export interface Repository {
    archiver(metadonnes: ArchiveJeune.Metadonnees): Promise<void>
    getIdsArchivesBefore(date: Date): Promise<number[]>
    delete(idArchive: number): Promise<void>
  }
}
