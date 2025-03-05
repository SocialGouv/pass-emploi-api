import { Offre } from 'src/domain/offre/offre'

export interface Emploi {
  id: string
  titre: string
  typeContrat: string
  nomEntreprise?: string
  localisation?: Emploi.Localisation
  alternance?: boolean
  duree?: string
  origine?: {
    nom: string
    logo?: string
  }
}

export const FavorisOffresEmploiRepositoryToken =
  'Favoris.OffresEmploi.Repository'

export namespace Emploi {
  export interface Repository {
    save(favori: Offre.Favori<Emploi>): Promise<void>

    get(
      idJeune: string,
      idOffreEmploi: string
    ): Promise<Offre.Favori<Emploi> | undefined>

    delete(idJeune: string, idOffreEmploi: string): Promise<void>
  }

  export interface Localisation {
    nom?: string
    codePostal?: string
    commune?: string
  }
}
