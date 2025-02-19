export const MILO_INSCRIT = 'ONGOING'
export const MILO_REFUS_TIERS = 'REFUSAL'
export const MILO_REFUS_JEUNE = 'REFUSAL_YOUNG'
export const MILO_PRESENT = 'ACHIEVED'

export enum OffreTypeCode {
  WORKSHOP = 'WORKSHOP',
  COLLECTIVE_INFORMATION = 'COLLECTIVE_INFORMATION'
}

export interface SessionDto {
  id: number
  nom: string
  dateHeureDebut: string
  dateHeureFin: string
  dateMaxInscription: string | null
  animateur: string
  lieu: string
  nbPlacesDisponibles: number | null
  commentaire: string | null
  /** Seulement dans structures/${idStructure}/sessions?rechercheInscrits=true **/
  instances: InscritSessionMiloDto[] | null
}

export interface OffreDto {
  id: number
  nom: string
  theme: string
  type: OffreTypeCode
  description: string | null
  nomPartenaire: string | null
}

export interface SessionConseillerDetailDto {
  session: SessionDto
  offre: OffreDto
}

export interface SessionParDossierJeuneDto {
  session: SessionDto
  offre: OffreDto
  sessionInstance?: { statut: string }
}

export interface SessionJeuneDetailDto {
  session: SessionDto
  offre: OffreDto
}

export interface ListeSessionsConseillerMiloDto {
  page: number
  nbSessions: number
  sessions: SessionConseillerDetailDto[]
}

export interface ListeSessionsJeuneMiloDto {
  page: number
  nbSessions: number
  sessions: SessionParDossierJeuneDto[]
}

export interface StructureConseillerMiloDto {
  code: string
  nomOfficiel: string
  nomUsuel: string | null
  principale: boolean
}

export interface InscritSessionMiloDto {
  idDossier: number
  idInstanceSession: number
  nom: string
  prenom: string
  statut: string
}

export interface InscrireJeuneSessionDto {
  id: number
  idDossier: number
  idSession: number
  statut: string
}
