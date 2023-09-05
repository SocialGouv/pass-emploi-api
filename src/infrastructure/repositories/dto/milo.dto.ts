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
  identifiant: string
  idDossier: number
  type: 'RDV' | 'SESSION' | string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string
  idType: number
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
  type: string
  statut:
    | 'Absent'
    | 'Annulé'
    | 'Non précisé'
    | 'Planifié'
    | 'Présent'
    | 'Reporté'
}

export interface SessionMiloDto {
  id: string
  nom: string
  dateHeureDebut: string
  dateHeureFin?: string
  lieu: string
  commentaire?: string
  idDossier: string
  statut: 'Réalisé' | 'Prescrit' | 'Refus tiers' | 'Refus jeune'
}
