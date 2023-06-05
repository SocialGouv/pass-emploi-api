// Pour l'instant c'est le même DTO peu importe l'api jeune / conseiller - liste / détail
// Ça évoluera par la suite et on split / nommera les nouveaux dtos comme il faut

export interface SessionConseillerDetailDto {
  session: {
    id: number
    nom: string // 255 car. max
    dateHeureDebut: string // yyyy-MM-dd HH:mm:SS - utilisé pour le tri et comme paramètre de filtre
    dateHeureFin: string // yyyy-MM-dd HH:mm:SS"
    dateMaxInscription: string | null //yyyy-MM-dd
    animateur: string // au format "Prénom Nom"
    lieu: string // 255 car. max
    nbPlacesDisponibles: number | null
    commentaire: string | null // 255 car. max
  }
  offre: {
    id: number
    nom: string
    theme: string // 255 car. max
    type: 'WORKSHOP' | 'COLLECTIVE_INFORMATION'
    description: string | null // 500 car. max
    nomPartenaire: string | null // 255 car. max
  }
}

export interface SessionConseillerListeDto {
  page: number
  nbSessions: number
  sessions: SessionConseillerDetailDto[]
}
