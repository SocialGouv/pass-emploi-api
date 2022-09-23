export const OffreServiceCiviqueRepositoryToken =
  'OffreServiceCivique.Repository'

export interface Localisation {
  latitude: number
  longitude: number
}

export interface ServiceCivique {
  id: string
  domaine: string
  titre: string
  ville?: string
  organisation?: string
  dateDeDebut?: string
  dateDeFin?: string
  description?: string
  lienAnnonce?: string
  adresseOrganisation?: string
  adresseMission?: string
  urlOrganisation?: string
  codeDepartement?: string
  codePostal?: string
  descriptionOrganisation?: string
  localisation?: Localisation
}

export namespace ServiceCivique {
  export interface Repository {
    save(idJeune: string, offre: ServiceCivique): Promise<void>

    get(idJeune: string, idOffre: string): Promise<ServiceCivique | undefined>

    delete(idJeune: string, idOffre: string): Promise<void>
  }
}
