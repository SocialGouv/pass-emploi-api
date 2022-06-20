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
