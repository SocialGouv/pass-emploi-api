import { CodeTypeRendezVous } from './rendez-vous/rendez-vous'
import { Recherche } from './offre/recherche/recherche'
import { Offre } from './offre/offre'
import { Core } from './core'

export const ArchiveJeuneRepositoryToken = 'ArchiveJeune.Repository'

export interface ArchiveJeune {
  rendezVous: ArchiveJeune.RendezVous[]
  actions: ArchiveJeune.Action[]
  favoris: {
    offresEmploi: Offre.Favori.Emploi[]
    offresImmersions: Offre.Favori.Immersion[]
    offresServiceCivique: Offre.Favori.ServiceCivique[]
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
    EMPLOI_DURABLE = 'Emploi durable (plus de 6 mois)',
    EMPLOI_COURT = 'Emploi court (moins de 6 mois)',
    CONTRAT_ARRIVE_A_ECHEANCE = 'Contrat arrivé à échéance',
    LIMITE_AGE = 'Limite d’âge atteinte',
    DEMANDE_DU_JEUNE = 'Demande du jeune de sortir du dispositif',
    NON_RESPECT_OU_ABANDON = 'Non respect des engagements ou abandon',
    DEMENAGEMENT = 'Déménagement',
    CHANGEMENT_CONSEILLER = 'Changement de conseiller',
    AUTRE = 'Autre'
  }

  export const mapMotifSuppressionDescription: Partial<
    Record<MotifSuppression, string>
  > = {
    'Emploi durable (plus de 6 mois)':
      'CDI, CDD de plus de 6 mois dont alternance, titularisation dans la fonction publique',
    'Limite d’âge atteinte':
      "Motif valable uniquement à partir de la fin du premier mois des 26 ans. A noter : dans le cas oû le jeune est considéré en tant que travailleur handicapé, l'âge passe à 30 ans.",
    Autre: 'Champ libre'
  }

  export interface Metadonnees {
    idJeune: string
    email?: string
    prenomJeune: string
    nomJeune: string
    structure: Core.Structure
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
    description: string
    dateCreation: Date
    dateActualisation: Date
    dateEcheance?: Date
    creePar: 'JEUNE' | 'CONSEILLER'
    commentaires?: Array<{
      date: Date
      message: string
      creePar: 'JEUNE' | 'CONSEILLER'
    }>
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
