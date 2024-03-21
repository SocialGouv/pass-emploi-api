import { CodeTypeRendezVous } from './rendez-vous/rendez-vous'
import { Recherche } from './offre/recherche/recherche'
import { Offre } from './offre/offre'
import { Core } from './core'
import Structure = Core.Structure
import { Result } from '../building-blocks/types/result'

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
  export enum CodeMotifSuppression {
    EMPLOI_DURABLE = 'EMPLOI_DURABLE',
    EMPLOI_COURT = 'EMPLOI_COURT',
    CONTRAT_ARRIVE_A_ECHEANCE = 'CONTRAT_ARRIVE_A_ECHEANCE',
    CESSATION_INSCRIPTION = 'CESSATION_INSCRIPTION',
    LIMITE_AGE = 'LIMITE_AGE',
    CHANGEMENT_ACCOMPAGNEMENT = 'CHANGEMENT_ACCOMPAGNEMENT',
    DEMANDE_DU_JEUNE = 'DEMANDE_DU_JEUNE',
    DEMANDE_DU_CONSEILLER = 'DEMANDE_DU_CONSEILLER',
    DEMANDE_DU_BENEFICIAIRE_BRSA = 'DEMANDE_DU_BENEFICIAIRE_BRSA',
    NON_RESPECT_OU_ABANDON = 'NON_RESPECT_OU_ABANDON',
    DEMENAGEMENT = 'DEMENAGEMENT',
    DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION = 'DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION',
    CHANGEMENT_CONSEILLER = 'CHANGEMENT_CONSEILLER',
    AUTRE = 'AUTRE'
  }
  export enum MotifSuppression {
    EMPLOI_DURABLE = 'Emploi durable (plus de 6 mois)',
    EMPLOI_COURT = 'Emploi court (moins de 6 mois)',
    CONTRAT_ARRIVE_A_ECHEANCE = 'Contrat arrivé à échéance',
    CESSATION_INSCRIPTION = 'Cessation d’inscription',
    LIMITE_AGE = 'Limite d’âge atteinte',
    CHANGEMENT_ACCOMPAGNEMENT = 'Changement d’accompagnement (autre modalité ou dispositif)',
    DEMANDE_DU_JEUNE = 'Demande du jeune de sortir du dispositif',
    DEMANDE_DU_CONSEILLER = 'Sortie du dispositif à l’origine du conseiller',
    DEMANDE_DU_BENEFICIAIRE_BRSA = 'Sortie du dispositif à l’origine du bénéficiaire',
    NON_RESPECT_OU_ABANDON = 'Non respect des engagements ou abandon',
    DEMENAGEMENT = 'Déménagement',
    DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION = 'Déménagement dans un territoire hors expérimentation',
    CHANGEMENT_CONSEILLER = 'Changement de conseiller',
    AUTRE = 'Autre'
  }

  export type MotifSuppressionSupport = 'Support'

  export const motifsSuppression: Record<
    CodeMotifSuppression,
    {
      motif: MotifSuppression
      structures: Core.Structure[]
      description?: string
    }
  > = {
    [CodeMotifSuppression.EMPLOI_DURABLE]: {
      motif: MotifSuppression.EMPLOI_DURABLE,
      structures: [
        Structure.PASS_EMPLOI,
        Structure.POLE_EMPLOI,
        Structure.MILO,
        Structure.POLE_EMPLOI_BRSA
      ],
      description:
        'CDI, CDD de plus de 6 mois dont alternance, titularisation dans la fonction publique'
    },
    [CodeMotifSuppression.EMPLOI_COURT]: {
      motif: MotifSuppression.EMPLOI_COURT,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [CodeMotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE]: {
      motif: MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [CodeMotifSuppression.CESSATION_INSCRIPTION]: {
      motif: MotifSuppression.CESSATION_INSCRIPTION,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [CodeMotifSuppression.LIMITE_AGE]: {
      motif: MotifSuppression.LIMITE_AGE,
      structures: [
        Structure.PASS_EMPLOI,
        Structure.POLE_EMPLOI,
        Structure.MILO
      ],
      description:
        "Motif valable uniquement à partir de la fin du premier mois des 26 ans. A noter : dans le cas oû le jeune est considéré en tant que travailleur handicapé, l'âge passe à 30 ans."
    },
    [CodeMotifSuppression.CHANGEMENT_ACCOMPAGNEMENT]: {
      motif: MotifSuppression.CHANGEMENT_ACCOMPAGNEMENT,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [CodeMotifSuppression.DEMANDE_DU_JEUNE]: {
      motif: MotifSuppression.DEMANDE_DU_JEUNE,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [CodeMotifSuppression.DEMANDE_DU_CONSEILLER]: {
      motif: MotifSuppression.DEMANDE_DU_CONSEILLER,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [CodeMotifSuppression.DEMANDE_DU_BENEFICIAIRE_BRSA]: {
      motif: MotifSuppression.DEMANDE_DU_BENEFICIAIRE_BRSA,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [CodeMotifSuppression.NON_RESPECT_OU_ABANDON]: {
      motif: MotifSuppression.NON_RESPECT_OU_ABANDON,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [CodeMotifSuppression.DEMENAGEMENT]: {
      motif: MotifSuppression.DEMENAGEMENT,
      structures: [
        Structure.PASS_EMPLOI,
        Structure.POLE_EMPLOI,
        Structure.MILO,
        Structure.POLE_EMPLOI_BRSA
      ]
    },
    [CodeMotifSuppression.DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION]: {
      motif: MotifSuppression.DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [CodeMotifSuppression.CHANGEMENT_CONSEILLER]: {
      motif: MotifSuppression.CHANGEMENT_CONSEILLER,
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [CodeMotifSuppression.AUTRE]: {
      motif: MotifSuppression.AUTRE,
      structures: [
        Structure.PASS_EMPLOI,
        Structure.POLE_EMPLOI,
        Structure.MILO,
        Structure.POLE_EMPLOI_BRSA
      ],
      description: 'Champ libre'
    }
  }

  export interface Metadonnees {
    idJeune: string
    email?: string
    prenomJeune: string
    nomJeune: string
    structure: Core.Structure
    dateCreation: Date
    datePremiereConnexion?: Date
    motif: MotifSuppression | MotifSuppressionSupport
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
    historique?: EntreeHistoriqueMessage[]
  }

  export type EntreeHistoriqueMessage = {
    date: string
    contenuPrecedent: string
  }

  export interface Repository {
    archiver(metadonnes: ArchiveJeune.Metadonnees): Promise<Result>
    getIdsArchivesBefore(date: Date): Promise<number[]>
    delete(idArchive: number): Promise<void>
  }
}
