export interface EvenementsEmploiDto {
  totalElements: number
  content: EvenementEmploiDto[]
}

export interface EvenementEmploiDto {
  id: number
  ville: string
  codePostal: string
  codeInsee: string
  longitude: number
  latitude: number
  description: string
  heureDebut: string
  heureFin: string
  timezone: string
  operations?: string[]
  diplomes?: null
  objectifs: string[]
  publics: string[]
  type: string
  benefices?: string[]
  modalites: string[]
  deroulement?: string
  nombrePlaceTotalDistance: number
  nombrePlaceTotalPresentiel: number
  nombreInscritDistance: number
  nombreInscritPresentiel: number
  dateEvenement: string
  titre: string
  codesRome: string[]
  multisectoriel: boolean
  offresId?: string[]
  urlDetailEvenement: string
}
export interface OffreEmploiDto {
  id: string
  intitule: string
  typeContrat: string
  dureeTravailLibelleConverti: string
  entreprise?: {
    nom: string
  }
  lieuTravail?: {
    libelle: string
    codePostal: string
    commune: string
  }
  contact: {
    urlPostulation: string
  }
  origineOffre: {
    origine?: string
    urlOrigine: string
    partenaires?: Array<{ nom?: string; url?: string; logo?: string }>
  }
  alternance?: boolean
}

export interface OffresEmploiDto {
  resultats: OffreEmploiDto[]
}

export interface OffresEmploiDtoWithTotal extends OffresEmploiDto {
  total: number
}

export enum TypeRDVPE {
  CREA = 'CREA',
  MODIF = 'MODIF',
  SUPP = 'SUPP'
}

export interface NotificationDto {
  idNotification: string
  codeNotification: string
  message: string
  typeMouvementRDV: TypeRDVPE
  typeRDV: string
  dateCreation: string
  idMetier?: string
}

export interface NotificationsPartenairesDto {
  listeNotificationsPartenaires: Array<{
    idExterneDE: string
    notifications: NotificationDto[]
  }>
}
