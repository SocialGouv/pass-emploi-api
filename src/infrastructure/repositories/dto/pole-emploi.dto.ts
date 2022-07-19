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
    urlOrigine: string
    partenaires?: Array<{ url?: string }>
  }
  alternance?: boolean
}

export interface OffresEmploiDto {
  resultats: OffreEmploiDto[]
}

export enum TypeRDVPE {
  CREA = 'CREA',
  MODIF = 'MODIF',
  SUPP = 'SUPP'
}
export interface NotificationsPartenairesDto {
  listeNotificationsPartenaires: Array<{
    idExterneDE: string
    notifications: Array<{
      idNotification: string
      codeNotification: string
      message: string
      typeMouvementRDV: TypeRDVPE
      typeRDV: string
      dateCreation: string
      idMetier?: string
    }>
  }>
}
