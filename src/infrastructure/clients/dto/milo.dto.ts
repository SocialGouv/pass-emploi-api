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

export interface SessionJeuneListeDto {
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
  sessions: SessionJeuneListeDto[]
}

export interface StructureConseillerMiloDto {
  id: number
  nomOfficiel: string
  nomUsuel: string
  principale: boolean
}

export interface InscritSessionMiloDto {
  idDossier: number
  idInstanceSession: number
  nom: string
  prenom: string
  statut: string
}
