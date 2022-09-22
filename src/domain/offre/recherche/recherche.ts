import { DateTime } from 'luxon'
import { Offre } from '../offre'

export const RecherchesRepositoryToken = 'RecherchesRepositoryToken'

export interface Recherche {
  id: string
  type: Recherche.Type
  titre: string
  metier?: string
  localisation?: string
  criteres?: Recherche.Emploi | Recherche.ServiceCivique | Recherche.Immersion
  idJeune: string
  dateCreation: DateTime
  dateDerniereRecherche: DateTime
  etat: Recherche.Etat
}

export namespace Recherche {
  export const DISTANCE_PAR_DEFAUT = 10

  export enum Type {
    OFFRES_EMPLOI = 'OFFRES_EMPLOI',
    OFFRES_IMMERSION = 'OFFRES_IMMERSION',
    OFFRES_ALTERNANCE = 'OFFRES_ALTERNANCE',
    OFFRES_SERVICES_CIVIQUE = 'OFFRES_SERVICES_CIVIQUE'
  }

  export enum Etat {
    SUCCES = 'SUCCES',
    ECHEC = 'ECHEC'
  }

  export namespace Geometrie {
    export const PROJECTION_WGS84 = 4326
  }

  export interface Repository {
    save(recherche: Recherche): Promise<void>

    update(recherche: Recherche): Promise<void>

    findAvantDate(
      typeRecherches: Recherche.Type[],
      nombreRecherches: number,
      date: DateTime
    ): Promise<Recherche[]>

    delete(idRecherche: string): Promise<void>

    existe(idRecherche: string, idJeune: string): Promise<boolean>

    trouverLesRecherchesImmersions(
      criteres: Recherche.Immersion,
      limit: number,
      offset: number
    ): Promise<Recherche[]>

    trouverLesRecherchesServicesCiviques(
      query: Recherche.ServiceCivique,
      limit: number,
      offset: number,
      dateDerniereRecherche: DateTime
    ): Promise<Recherche[]>
  }

  export interface Emploi {
    q?: string
    departement?: string
    alternance?: boolean
    experience?: Offre.Emploi.Experience[]
    debutantAccepte?: boolean
    contrat?: Offre.Emploi.Contrat[]
    duree?: Offre.Emploi.Duree[]
    rayon?: number
    commune?: string
    minDateCreation?: DateTime
  }

  export interface Immersion {
    rome: string
    lat: number
    lon: number
    distance?: number
  }

  export interface ServiceCivique {
    lat?: number
    lon?: number
    distance?: number
    dateDeDebutMinimum?: DateTime
    dateDeDebutMaximum?: DateTime
    domaine?: string
    dateDeCreationMinimum?: DateTime
  }
}
