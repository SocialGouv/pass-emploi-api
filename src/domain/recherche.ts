import { GetOffresEmploiQuery } from '../application/queries/get-offres-emploi.query.handler'
import { GetOffresImmersionQuery } from '../application/queries/get-offres-immersion.query.handler'
import { DateTime } from 'luxon'
import { GetServicesCiviqueQuery } from '../application/queries/get-services-civique.query.handler'

export const RecherchesRepositoryToken = 'RecherchesRepositoryToken'

export interface Recherche {
  id: string
  type: Recherche.Type
  titre: string
  metier?: string
  localisation?: string
  criteres?:
    | GetOffresEmploiQuery
    | GetOffresImmersionQuery
    | GetServicesCiviqueQuery
  idJeune: string
  dateCreation: DateTime
  dateDerniereRecherche: DateTime
  etat: Recherche.Etat
}

export namespace Recherche {
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
    createRecherche(recherche: Recherche): Promise<void>
    update(recherche: Recherche): Promise<void>
    findAvantDate(
      typeRecherches: Recherche.Type[],
      nombreRecherches: number,
      date: DateTime
    ): Promise<Recherche[]>
    deleteRecherche(idRecherche: string): Promise<void>
    existe(idRecherche: string, idJeune: string): Promise<boolean>
    trouverLesRecherchesImmersions(
      criteres: GetOffresImmersionQuery,
      limit: number,
      offset: number
    ): Promise<Recherche[]>
    trouverLesRecherchesServicesCiviques(
      query: GetServicesCiviqueQuery,
      limit: number,
      offset: number,
      depuis: DateTime
    ): Promise<Recherche[]>
  }
}
