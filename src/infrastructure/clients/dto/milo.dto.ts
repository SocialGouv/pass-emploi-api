export enum OffreTypeCode {
  WORKSHOP = 'WORKSHOP',
  COLLECTIVE_INFORMATION = 'COLLECTIVE_INFORMATION'
}

export interface SessionConseillerDetailDto {
  session: {
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
  offre: {
    id: number
    nom: string
    theme: string
    type: OffreTypeCode
    description: string | null
    nomPartenaire: string | null
  }
}

export interface SessionConseillerMiloListeDto {
  page: number
  nbSessions: number
  sessions: SessionConseillerDetailDto[]
}

export interface StructureConseillerMiloDto {
  id: number
  nomOfficiel: string
  nomUsuel: string
  principale: boolean
}
