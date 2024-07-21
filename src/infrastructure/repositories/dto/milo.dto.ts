import { JeuneMilo } from '../../../domain/milo/jeune.milo'

export interface DossierMiloDto {
  idDossier: number
  idJeune: string
  numeroDE: string
  adresse?: {
    numero: string
    libelleVoie: string
    complement: string
    codePostal: string
    commune: string
  }
  nomNaissance: string
  nomUsage: string
  prenom: string
  dateNaissance: string
  mail: string | null
  structureRattachement?: {
    nomUsuel: string
    nomOfficiel: string
    codeStructure?: string
  }
  accompagnementCEJ: {
    accompagnementCEJ: boolean
    dateDebut: string | null
    dateFinPrevue: string | null
    dateFinReelle: string | null
    premierAccompagnement: string | null
  }
  situations: [
    {
      etat: JeuneMilo.EtatSituation
      dateFin: string | null
      categorieSituation: JeuneMilo.CategorieSituation
      codeRomeMetierPrepare: string | null
      codeRomePremierMetier: string
      codeRomeMetierExerce: string | null
    }
  ]
}

export interface EvenementMiloDto {
  // Identifiant technique de l’évènement
  identifiant: string
  idDossier: number
  // Objet métier
  type: 'RDV' | 'SESSION' | 'DOSSIER' | string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | string
  // Identifiant de l'objet métier
  idType: number | null
  date: string
}

export interface RendezVousMiloDto {
  id: number
  dateHeureDebut: string
  dateHeureFin?: string
  objet: string
  conseiller: string
  idDossier: number
  commentaire?: string
  lieu?: string
  type: string
  statut:
    | 'Absent'
    | 'Annulé'
    | 'Non précisé'
    | 'Planifié'
    | 'Présent'
    | 'Reporté'
}

export interface InstanceSessionMiloDto {
  id: string
  idSession: string
  nom: string
  dateHeureDebut: string
  dateHeureFin?: string
  lieu: string
  commentaire?: string
  idDossier: string
  statut: 'Réalisé' | 'Prescrit' | 'Refus tiers' | 'Refus jeune'
}
