import { CodeTypeRendezVous } from './rendez-vous/rendez-vous'
import { Recherche } from './offre/recherche/recherche'
import { Offre } from './offre/offre'
import { Core } from './core'
import Structure = Core.Structure

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
  export type MotifSuppressionSupport = 'Support'

  export const mapMotifSuppressionDescription: Partial<
    Record<MotifSuppression, string>
  > = {
    'Emploi durable (plus de 6 mois)':
      'CDI, CDD de plus de 6 mois dont alternance, titularisation dans la fonction publique',
    'Limite d’âge atteinte':
      "Motif valable uniquement à partir de la fin du premier mois des 26 ans. A noter : dans le cas oû le jeune est considéré en tant que travailleur handicapé, l'âge passe à 30 ans.",
    Autre: 'Champ libre'
  }

  export enum MotifsSuppression {
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

  export const motifsDeSuppression: {
    [key in ArchiveJeune.MotifsSuppression]: {
      motif: string
      structures: Core.Structure[]
      description?: string
    }
  } = {
    [MotifsSuppression.EMPLOI_DURABLE]: {
      motif: 'Emploi durable (plus de 6 mois)',
      structures: [
        Structure.PASS_EMPLOI,
        Structure.POLE_EMPLOI,
        Structure.MILO,
        Structure.POLE_EMPLOI_BRSA
      ],
      description:
        'CDI, CDD de plus de 6 mois dont alternance, titularisation dans la fonction publique'
    },
    [MotifsSuppression.EMPLOI_COURT]: {
      motif: 'Emploi court (moins de 6 mois)',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [MotifsSuppression.CONTRAT_ARRIVE_A_ECHEANCE]: {
      motif: 'Contrat arrivé à échéance',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [MotifsSuppression.CESSATION_INSCRIPTION]: {
      motif: 'Cessation d’inscription',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [MotifsSuppression.LIMITE_AGE]: {
      motif: 'Limite d’âge atteinte',
      structures: [
        Structure.PASS_EMPLOI,
        Structure.POLE_EMPLOI,
        Structure.MILO
      ],
      description:
        "Motif valable uniquement à partir de la fin du premier mois des 26 ans. A noter : dans le cas oû le jeune est considéré en tant que travailleur handicapé, l'âge passe à 30 ans."
    },
    [MotifsSuppression.CHANGEMENT_ACCOMPAGNEMENT]: {
      motif: 'Changement d’accompagnement (autre modalité ou dispositif)',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [MotifsSuppression.DEMANDE_DU_JEUNE]: {
      motif: 'Demande du jeune de sortir du dispositif',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [MotifsSuppression.DEMANDE_DU_CONSEILLER]: {
      motif: 'Sortie du dispositif à l’origine du conseiller',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [MotifsSuppression.DEMANDE_DU_BENEFICIAIRE_BRSA]: {
      motif: 'Sortie du dispositif à l’origine du bénéficiaire',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [MotifsSuppression.NON_RESPECT_OU_ABANDON]: {
      motif: 'Non respect des engagements ou abandon',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [MotifsSuppression.DEMENAGEMENT]: {
      motif: 'Déménagement',
      structures: [
        Structure.PASS_EMPLOI,
        Structure.POLE_EMPLOI,
        Structure.MILO,
        Structure.POLE_EMPLOI_BRSA
      ]
    },
    [MotifsSuppression.DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION]: {
      motif: 'Déménagement dans un territoire hors expérimentation',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI_BRSA]
    },
    [MotifsSuppression.CHANGEMENT_CONSEILLER]: {
      motif: 'Changement de conseiller',
      structures: [Structure.PASS_EMPLOI, Structure.POLE_EMPLOI, Structure.MILO]
    },
    [MotifsSuppression.AUTRE]: {
      motif: 'Autre',
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
  }

  export interface Repository {
    archiver(metadonnes: ArchiveJeune.Metadonnees): Promise<void>
    getIdsArchivesBefore(date: Date): Promise<number[]>
    delete(idArchive: number): Promise<void>
  }
}
