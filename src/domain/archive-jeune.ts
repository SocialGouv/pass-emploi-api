import { Result } from '../building-blocks/types/result'
import { Core } from './core'
import { Offre } from './offre/offre'
import { Recherche } from './offre/recherche/recherche'
import { CodeTypeRendezVous } from './rendez-vous/rendez-vous'

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
    FORMATION = 'Formation',
    CDI = 'CDI',
    CDD_CTT = 'CDD/CTT >= 6 mois',
    EMPLOI_COURT = 'Emploi court (moins de 6 mois)',
    CONTRAT_ARRIVE_A_ECHEANCE = 'Contrat arrivé à échéance',
    CESSATION_INSCRIPTION = 'Cessation d’inscription',
    LIMITE_AGE = 'Limite d’âge atteinte',
    CHANGEMENT_ACCOMPAGNEMENT = 'Changement d’accompagnement (autre modalité ou dispositif)',
    DEMANDE_DU_JEUNE = 'Demande du jeune de sortir du dispositif',
    DEMANDE_DU_CONSEILLER = 'Sortie du dispositif à l’origine du conseiller',
    DEMANDE_DU_BENEFICIAIRE_BRSA = 'Sortie du dispositif à l’origine du bénéficiaire',
    CONSEILLER_OU_ABANDON = 'Sortie du dispositif à l’origine du conseiller ou abandon',
    NON_RESPECT_OU_ABANDON = 'Non respect des engagements ou abandon',
    DEMENAGEMENT = 'Déménagement',
    DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION = 'Déménagement dans un territoire hors expérimentation',
    CHANGEMENT_CONSEILLER = 'Changement de conseiller',
    SERVICE_CIVIQUE = 'Service civique',
    CREATION_ENTREPRISE = 'Création d’entreprise',
    ESAT = 'Entrée en ESAT',
    AUTRE = 'Autre'
  }

  export type MotifSuppressionSupport = 'Support'

  export const motifsSuppression: Record<
    MotifSuppression,
    {
      structures: Core.Structure[]
      description?: string
    }
  > = {
    [MotifSuppression.EMPLOI_DURABLE]: {
      structures: [
        Core.Structure.POLE_EMPLOI,
        Core.Structure.MILO,
        Core.Structure.POLE_EMPLOI_BRSA,
        Core.Structure.CONSEIL_DEPT
      ],
      description:
        'CDI, CDD de plus de 6 mois dont alternance, titularisation dans la fonction publique'
    },
    [MotifSuppression.CDI]: {
      structures: [Core.Structure.POLE_EMPLOI_AIJ]
    },
    [MotifSuppression.CDD_CTT]: {
      structures: [Core.Structure.POLE_EMPLOI_AIJ]
    },
    [MotifSuppression.EMPLOI_COURT]: {
      structures: [
        Core.Structure.POLE_EMPLOI,
        Core.Structure.MILO,
        Core.Structure.POLE_EMPLOI_AIJ
      ]
    },
    [MotifSuppression.FORMATION]: {
      structures: [Core.Structure.POLE_EMPLOI_AIJ]
    },
    [MotifSuppression.SERVICE_CIVIQUE]: {
      structures: [Core.Structure.POLE_EMPLOI_AIJ]
    },
    [MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE]: {
      structures: [Core.Structure.POLE_EMPLOI, Core.Structure.MILO]
    },
    [MotifSuppression.CESSATION_INSCRIPTION]: {
      structures: [
        Core.Structure.POLE_EMPLOI_BRSA,
        Core.Structure.POLE_EMPLOI_AIJ,
        Core.Structure.CONSEIL_DEPT
      ]
    },
    [MotifSuppression.LIMITE_AGE]: {
      structures: [Core.Structure.POLE_EMPLOI, Core.Structure.MILO],
      description:
        "Motif valable uniquement à partir de la fin du premier mois des 26 ans. A noter : dans le cas oû le jeune est considéré en tant que travailleur handicapé, l'âge passe à 30 ans."
    },
    [MotifSuppression.CHANGEMENT_ACCOMPAGNEMENT]: {
      structures: [
        Core.Structure.POLE_EMPLOI_BRSA,
        Core.Structure.POLE_EMPLOI_AIJ,
        Core.Structure.CONSEIL_DEPT
      ]
    },
    [MotifSuppression.DEMANDE_DU_JEUNE]: {
      structures: [Core.Structure.POLE_EMPLOI, Core.Structure.MILO]
    },
    [MotifSuppression.DEMANDE_DU_CONSEILLER]: {
      structures: [Core.Structure.POLE_EMPLOI_BRSA, Core.Structure.CONSEIL_DEPT]
    },
    [MotifSuppression.DEMANDE_DU_BENEFICIAIRE_BRSA]: {
      structures: [Core.Structure.POLE_EMPLOI_BRSA, Core.Structure.CONSEIL_DEPT]
    },
    [MotifSuppression.NON_RESPECT_OU_ABANDON]: {
      structures: [Core.Structure.POLE_EMPLOI, Core.Structure.MILO]
    },
    [MotifSuppression.CONSEILLER_OU_ABANDON]: {
      structures: [Core.Structure.POLE_EMPLOI_AIJ]
    },
    [MotifSuppression.DEMENAGEMENT]: {
      structures: [
        Core.Structure.POLE_EMPLOI,
        Core.Structure.MILO,
        Core.Structure.POLE_EMPLOI_BRSA,
        Core.Structure.POLE_EMPLOI_AIJ,
        Core.Structure.CONSEIL_DEPT
      ]
    },
    [MotifSuppression.DEMENAGEMENT_TERRITOIRE_HORS_EXPERIMENTATION]: {
      structures: [Core.Structure.POLE_EMPLOI_BRSA, Core.Structure.CONSEIL_DEPT]
    },
    [MotifSuppression.CHANGEMENT_CONSEILLER]: {
      structures: [Core.Structure.POLE_EMPLOI, Core.Structure.MILO]
    },
    [MotifSuppression.CREATION_ENTREPRISE]: {
      structures: [Core.Structure.POLE_EMPLOI_AIJ]
    },
    [MotifSuppression.ESAT]: {
      structures: [Core.Structure.POLE_EMPLOI_AIJ]
    },
    [MotifSuppression.AUTRE]: {
      structures: [
        Core.Structure.POLE_EMPLOI,
        Core.Structure.MILO,
        Core.Structure.POLE_EMPLOI_BRSA,
        Core.Structure.POLE_EMPLOI_AIJ,
        Core.Structure.CONSEIL_DEPT
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
    idPartenaire?: string
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
